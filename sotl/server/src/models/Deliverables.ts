import mongoose, { Schema, Document, Model } from 'mongoose';

// Define the interface for the Deliverables document
interface IDeliverables extends Document {
  name: string; // Name of the deliverable
  batch: string // Indicates the batch of students the deliverable is assigned to
  approve: boolean; // Indicates if the deliverable need approval from lecturer
  start_at: Date;
  end_at: Date;
  isPublic: boolean; // Indicates if the deliverable is public
  dependsOn?: string; // Reference to another deliverable
}

// Define the Deliverables schema
const deliverablesSchema: Schema<IDeliverables> = new Schema({
  name: { type: String, required: true }, // Defines the type of assessment
  batch: { type: String, required: true }, // Reference to Quiz model
  approve: { type: Boolean, required: true },
  start_at: { type: Date, required: false },
  end_at: { type: Date, required: false },
  isPublic: { type: Boolean, required: true },
  dependsOn: { type: String, required: false }
});


// Create the Deliverables model
const Deliverables: Model<IDeliverables> = mongoose.model<IDeliverables>('Deliverables', deliverablesSchema);

export default Deliverables;
export { IDeliverables, deliverablesSchema };   