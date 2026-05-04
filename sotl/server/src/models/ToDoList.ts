import mongoose, { Schema, Document, Model } from 'mongoose';

// Define the interface for the ToDoList document
interface IToDoList extends Document {
  tasks: mongoose.Types.ObjectId[]; // Reference to TaskContent model
  task_content: mongoose.Types.ObjectId; // Reference to TaskContent model
  //sprint: mongoose.Schema.Types.ObjectId; // Reference to Sprint model
}

// Define the ToDoList schema
const toDoListSchema: Schema<IToDoList> = new Schema({
  tasks: { type: [{ type: Schema.Types.ObjectId, ref: 'TaskContent' }], required: true }, // Reference to TaskContent model
  task_content: { type: Schema.Types.ObjectId, ref: 'TaskContent', required: true }, // Reference to TaskContent model
  //sprint: { type: Schema.Types.ObjectId, ref: 'Sprint', required: true }, // Reference to Sprint model
});

// Create the ToDoList model
const ToDoList: Model<IToDoList> = mongoose.model<IToDoList>('ToDoList', toDoListSchema);

export default ToDoList;
export { IToDoList, toDoListSchema };