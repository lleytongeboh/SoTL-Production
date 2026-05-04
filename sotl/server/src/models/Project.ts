import mongoose, { Schema, Document, Model } from 'mongoose';

  // Define the interface for the Project document
  interface IProject extends Document {
    title: string;
    description: string;
    deliverables: {
      _id?: mongoose.Types.ObjectId;
      name: string;
      file_path_uri: string;
      created_at: Date;
      //type: number; // Assuming this is a numeric type (1 - approve = true, 0 - approve = false)
      status?: number; // Optional, only applicable if type = 1, status = 0 is pending, status = 1 is approved, status = 2 is rejected
      comment?: string;
      deliverable_id: mongoose.Types.ObjectId; // Reference to Deliverables model
    }[];
    mark_items?: {
      deliverables_type: number; // Assuming this relates to the type of deliverable
      overall_mark: number;
    }[];
    to_do_list?: mongoose.Types.ObjectId[]; // Reference to ToDoList model
    sprint_list?: mongoose.Types.ObjectId[]; 
    badges?: mongoose.Types.ObjectId[]; // Reference to Badge model
  }

// Define the Project schema
const projectSchema: Schema<IProject> = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  deliverables: [
    {
      name: { type: String, required: true },
      file_path_uri: { type: String, required: true },
      created_at: { type: Date, required: true },
      //type: { type: Number, required: true },
      status: { type: Number }, // Conditional requirement
      comment: { type: String },
      deliverable_id: { type: Schema.Types.ObjectId, ref: 'Deliverables', required: true } // Reference to Deliverables model
    }
  ],
  mark_items: [
    {
      deliverables_type: { type: Number, required: true },
      overall_mark: { type: Number, required: true },
    }
  ],
  to_do_list: { type: [{ type: Schema.Types.ObjectId, ref: 'ToDoList' }], required: true }, // Reference to ToDoList model
  sprint_list: { type: [{ type: Schema.Types.ObjectId, ref: 'Sprint' }], required: true }, // Reference to Sprint model
  badges: { type: [{ type: Schema.Types.ObjectId, ref: 'Badge' }], required: true } // Reference to Badge model
});

// Create the Project model
const Project: Model<IProject> = mongoose.model<IProject>('Project', projectSchema);



export default Project;
export { IProject, projectSchema };