import mongoose, { Schema, Document, Model } from "mongoose";
import User, { IUser } from "./User";

// Define the interface for the mark item object
interface IMarkItem {
  type: number; // 0 = Peer / Individual Evaluation | 1 = Team Evaluation | 2 = Project Evaluation
  mark_value: number;
}

// Define the interface for the mark object
interface IMark {
  batch: string;
  mark_items: IMarkItem[];
}

// Define the interface for the batch object
interface IBatch {
  _id: mongoose.Types.ObjectId;
  batch: string;
}

// Define the interface for Student
interface IStudent extends IUser {
  matricNumber: string;
  batch: IBatch[]; // Array of batch objects
  point: number;
  mark: IMark[]; // Array of mark objects
  loginAsBatch: string;
  // Additional fields specific to Student
}

// Define the Student schema by extending the User schema
const studentSchema: Schema<IStudent> = new Schema({
  matricNumber: { type: String, required: true },
  batch: [
    {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId(),
      },
      batch: { type: String, required: true },
    },
  ], // Array of objects containing _id and batch string
  point: { type: Number, required: true },
  loginAsBatch: { type: String, required: true },
  mark: [
    {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId(),
      },
      batch: { type: String, required: true },
      mark_items: [
        {
          _id: {
            type: mongoose.Schema.Types.ObjectId,
            default: () => new mongoose.Types.ObjectId(),
          },
          type: { type: Number, required: true },
          mark_value: { type: Number, required: true },
        },
      ], // Array of mark item objects
    },
  ],
  // Any additional fields specific to Student can be defined here
});

// Create a model for Student using the User base schema and discriminator
const Student: Model<IStudent> = User.discriminator<IStudent>(
  "Student",
  studentSchema
);

export default Student;
export { IStudent };
