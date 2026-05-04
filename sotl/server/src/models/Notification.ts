import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  recipient?: mongoose.Types.ObjectId; // Reference to the user receiving the notification
  group?: mongoose.Types.ObjectId; // Reference to the Group, when there is the info for all the student in the group (e.g. submission, badge...)
  message: string;                          // The notification message
  type: string;                             // Type of notification (e.g., 'info', 'warning', 'alert')
  read: boolean;                            // Whether the notification has been read
  createdAt?: Date;                         // Automatically added by Mongoose with timestamps
  updatedAt?: Date;                         // Automatically added by Mongoose with timestamps
}

// Define the Notification schema with timestamps
const NotificationSchema = new Schema<INotification>(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    group: {type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: false},
    message: { type: String, required: true },
    type: { type: String, enum: ['info', 'warning', 'alert'], default: 'info' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }  // Enable automatic createdAt and updatedAt fields
);
 
const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
export default Notification;