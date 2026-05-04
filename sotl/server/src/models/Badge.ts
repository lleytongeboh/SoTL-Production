import mongoose, { Schema, Document, Model } from "mongoose";

// Define the interface for the Badge document
interface IBadge extends Document {
  name: string;
  deliverable_completion: mongoose.Types.ObjectId[]; // Array of ObjectId referencing Deliverables
  description: string;
  color: string;
  order: number;
  batch: string;
}

// Define the Badge schema
const badgeSchema: Schema<IBadge> = new Schema({
  name: { type: String, required: true }, // The name property, required
  deliverable_completion: [
    { type: Schema.Types.ObjectId, ref: "Deliverables" },
  ], // Array of ObjectIds
  description: { type: String, required: true }, // Description of the badge
  color: { type: String, required: true }, // Color associated with the badge
  order: { type: Number, required: true }, // Order for sorting purposes
  batch: { type: String, required: true }, // Batch for which the badge is applicable
});

// Create the Badge model
const Badge: Model<IBadge> = mongoose.model<IBadge>("Badge", badgeSchema);

export default Badge;
export { IBadge, badgeSchema };
