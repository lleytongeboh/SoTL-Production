// src/services/notification.service.ts
import Notification, { INotification } from "../models/Notification";
import Group from "../models/Group";
import mongoose, { ClientSession } from "mongoose";

export const getAllNotifications = async (userId: string, role: string) => {
  try {
    if (!userId) {
      throw new Error("User ID not found in the request");
    }
    if (!role) {
      throw new Error("Role not found in the request");
    }
    let notifications;
    if (role === "student") {
      notifications = await Notification.find({ recipient: userId }).sort({
        createdAt: -1,
      });
      const groupIds = await Group.find({
        "team_members.student_id": userId,
      }).select("_id");

      if (groupIds.length > 0) {
        // get group notifications
        const groupNotifications = await Notification.find({
          group: { $in: groupIds },
        }).sort({
          createdAt: -1,
        });
        notifications = [...notifications, ...groupNotifications];
        notifications.sort(
          (a, b) =>
            (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
        );
      }
    } else if (role === "lecturer") {
      notifications = await Notification.find({
        $or: [
          { recipient: userId },
          {
            $and: [
              { recipient: { $exists: false } }, // `recipient` does not exist
              { group: { $exists: false } }, // `group` does not exist
            ],
          },
        ],
      }).sort({
        createdAt: -1,
      });
    }

    return notifications;
  } catch (error: any) {
    throw new Error(`Failed to fetch notifications: ${error.message}`);
  }
};

export const createNewNotification = async (data: {
  recipient?: mongoose.Types.ObjectId;
  group?: mongoose.Types.ObjectId;
  message: string;
  type: string;
}) => {
  const { recipient, group, message, type } = data;

  try {
    const newNotification = new Notification({
      recipient,
      group,
      message,
      type,
      read: false,
    });

    const notificationCreated = await newNotification.save();

    return newNotification;
  } catch (error: any) {
    throw new Error(`Failed to create notification: ${error.message}`);
  }
};

export const markNotificationAsRead = async (id: string) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    );

    if (!notification) {
      throw new Error("Notification not found");
    }

    return notification;
  } catch (error: any) {
    throw new Error(`Failed to mark notification as read: ${error.message}`);
  }
};

export const markAllNotificationsAsRead = async (userId: string) => {
  const session = await mongoose.startSession(); // Start a session
  session.startTransaction(); // Start the transaction
  try {
    // Step 1: Find all unread notifications for the specified user
    const notificationsToUpdate = await Notification.find({
      recipient: userId,
      read: false,
    })
      .session(session)
      .read("primary"); // Ensure reading from the primary

    // Step 2: Update the notifications to mark them as read
    await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true },
      { session } // Use the session for the update
    );

    // Step 3: Commit the transaction
    await session.commitTransaction();

    // Step 4: Return the updated notifications
    return notificationsToUpdate.map((notification) => ({
      ...notification.toObject(), // Convert Mongoose document to plain JavaScript object
      read: true, // Set read status to true in the returned object
    }));
  } catch (error: any) {
    // If there is an error, abort the transaction
    await session.abortTransaction();
    throw new Error(
      `Failed to mark all notifications as read: ${error.message}`
    );
  } finally {
    // End the session
    session.endSession();
  }
};

export const isHaveNotification = async (userId: mongoose.Types.ObjectId) => {
  try {
    const notifications = await Notification.find({
      recipient: userId,
    });

    return notifications.length > 0;
  } catch (error: any) {
    throw new Error(`Failed to check notification: ${error.message}`);
  }
};

export const removeNotificationByUserId = async (
  userId: mongoose.Types.ObjectId,
  session: ClientSession
) => {
  try {
    const remove = await Notification.deleteMany(
      { recipient: userId },
      { session }
    );
    console.log("Notifications deleted:", remove);
    return remove.acknowledged;
  } catch (error: any) {
    throw new Error(`Failed to remove notification: ${error.message}`);
  }
};
