import mongoose, { Schema, Document, Model } from 'mongoose';

// Define the interface for the Comment document
interface IComment extends Document {
    content: string;
    created_at: Date;
    updated_at: Date;
    user: mongoose.Types.ObjectId; // Reference to User model
}

// Define the Comment schema
const commentSchema: Schema<IComment> = new Schema({
    content: { type: String, required: true },
    created_at: { type: Date, required: true },
    updated_at: { type: Date, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to User model
});

// Create the Comment model
const Comment: Model<IComment> = mongoose.model<IComment>('Comment', commentSchema);

export default Comment;
export { IComment, commentSchema };