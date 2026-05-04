import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// Define the interface for the Group document
interface IGroup extends Document {
  _id: Schema.Types.ObjectId | Types.ObjectId | string;
  name: string;
  description: string;
  team_members: {
    student_id: mongoose.Types.ObjectId; // Assuming student_id is an ObjectId reference
    group_role: string;
    project_role?: string[];
  }[];
  project?: mongoose.Types.ObjectId; // Assuming project_id is an ObjectId reference
  batch: string;
}

// Define the Group schema
const groupSchema: Schema<IGroup> = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  team_members: [
    {
      student_id: { type: Schema.Types.ObjectId, ref: 'Student', required: true }, // Reference to Student model
      group_role: { type: String, required: true }, // Array of roles
      project_role: { type: [String], required: false }, // Array of roles for the project
    }
  ],
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: false }, // Reference to Project model
  batch: { type: String, required: true },
});

// Create the Group model
const Group: Model<IGroup> = mongoose.model<IGroup>('Group', groupSchema);

export default Group;
export { IGroup, groupSchema };