import mongoose, { Schema, Document, Model } from 'mongoose';
import User, { IUser, userSchema } from './User';

// Define the interface for Lecturer
interface ILecturer extends IUser {
  // Additional fields specific to Lecturer, if any
}

// Define the Lecturer schema by extending the User schema
const lecturerSchema: Schema<ILecturer> = new Schema({
  // Any additional fields specific to Lecturer can be defined here
});

// Create a model for Lecturer using the User base schema and discriminator
const Lecturer: Model<ILecturer> = User.discriminator<ILecturer>(
  'Lecturer',
  lecturerSchema
);

export default Lecturer;