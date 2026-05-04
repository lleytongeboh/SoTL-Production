import mongoose, { Schema, Document, Model } from 'mongoose';

// Define the interface for the TaskContent document
interface ITaskContent extends Document {
    creator: mongoose.Types.ObjectId; // Reference to Student model
    assignee?: mongoose.Types.ObjectId; // Reference to Student model
    title: string;
    description?: string;
    status: number;
    priority?: number;
    created_at: Date;
    updated_at: Date;
    completed_at: Date;
    comments?: mongoose.Types.ObjectId[] // Reference to Comment model
}

// Define the TaskContent schema
const taskContentSchema: Schema<ITaskContent> = new Schema({
    creator: { type: Schema.Types.ObjectId, ref: 'Student', required: true }, // Reference to Student model
    assignee: { type: Schema.Types.ObjectId, ref: 'Student' }, // Reference to Student model
    title: { type: String, required: true },
    description: { type: String },
    status: { type: Number, required: true },
    priority: { type: Number },
    created_at: { type: Date, required: true },
    updated_at: { type: Date, required: true },
    completed_at: { type: Date },
    comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }] // Reference to Comment model
});

// Create the TaskContent model
const TaskContent: Model<ITaskContent> = mongoose.model<ITaskContent>('TaskContent', taskContentSchema);

export default TaskContent;
export { ITaskContent, taskContentSchema };