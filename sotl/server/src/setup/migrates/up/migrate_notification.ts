import mongoose, { ClientSession } from "mongoose";
import Notification from "../../../models/Notification"; // Import the Notification model
import User from "../../../models/User"; // Assume this model represents the users receiving notifications

// Define the migration function
export async function migrateNotification(session: ClientSession): Promise<void> {
  try {
    // Retrieve the users who will receive the notifications
    const users = await User.find({}).session(session).read("primary");

    // Check if users exist
    if (!users.length) {
      throw new Error("No users found to receive notifications");
    }

    // Prepare sample notifications
    const sampleNotifications = users.map(user => ({
      recipient: user._id,
      message: `Hello ${user.name}, you have a new notification!`,
      type: 'info',
      read: false
    }));

    // Insert notifications into the Notification collection
    await Notification.insertMany(sampleNotifications, { session });

    console.log("Notifications created: Done!");
  } catch (e) {
    // Customize error message
    let customErrorMessage = `
      Error during Notifications migration:
      - Reason: Failed to insert notification data into the database.
    `;

    if (e instanceof Error) {
      customErrorMessage += `
        - Original Error: ${e.message}
        - Stack Trace: ${e.stack}
      `;
    } else {
      customErrorMessage += `
        - Original Error: ${String(e)}
      `;
    }

    throw new Error(customErrorMessage); // Rethrow with customized message
  }
}