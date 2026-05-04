import mongoose, { Schema, Document, Model } from 'mongoose';

// Define the interface for the Sprint document
interface ISprint extends Document {
    to_do_list: mongoose.Types.ObjectId[]; // Reference to ToDoList model
    task_content: mongoose.Types.ObjectId; // Reference to TaskContent model
}

// Define the Sprint schema
const sprintSchema: Schema<ISprint> = new Schema({
    to_do_list: { type: [{ type: Schema.Types.ObjectId, ref: 'ToDoList' }], required: true }, // Reference to ToDoList model
    task_content: { type: Schema.Types.ObjectId, ref: 'TaskContent', required: true }, // Reference to TaskContent model
});

// Create the Sprint model
const Sprint: Model<ISprint> = mongoose.model<ISprint>('Sprint', sprintSchema);

export default Sprint;
export { ISprint, sprintSchema };