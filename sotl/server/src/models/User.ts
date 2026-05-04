// import mongoose, { Document } from 'mongoose';

// interface User extends Document {
//     email: string;
//     password: string;
//     role: string;
//   }

// const userSchema = new mongoose.Schema({
//     email: { type: String, required: true, unique: true },
//     password: { type: String, required: true },
//     role: { type: String, enum: ['client', 'student', 'admin']}
// });


// export default mongoose.model<User>('User', userSchema, 'User');

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// Define the interface for the User document
interface IUser extends Document {
  _id: Types.ObjectId | string;
  name: string;
  designation?: string;
  company?: string;
  role: 'lecturer' | 'student' | 'client';
  lastLogin?: Date;
  email: string;
  password: string;
  created_at: Date;
}

// Define the User schema
const userSchema: Schema<IUser> = new Schema({
  name: { type: String, required: true },
  designation: { type: String, required: false },
  company: { type: String, required: false },
  role: { type: String, enum: ['lecturer', 'student', 'client'], required: true },
  lastLogin: { type: Date, required: false },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
});

// Compound index for common queries
userSchema.index({ role: 1, name: 1 });
userSchema.index({ email: 1 });

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User;
export { IUser, userSchema };
