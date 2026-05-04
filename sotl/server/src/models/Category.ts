  import { Schema, model, Document, Types } from 'mongoose';

  // Define the Category interface that extends Mongoose's Document
  export interface ICategory extends Document {
    _id: Types.ObjectId | string;
    name: string;
    belonged: Types.ObjectId[];
    type: 0 | 1;
    visibleMark: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }

  // Define the Category schema
  const categorySchema = new Schema<ICategory>(
    {
      name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
      },
      belonged: [
        {
          type: Types.ObjectId,
          ref: 'User',
        },
      ],
      type: {
        type: Number,
        enum: [0, 1], // Allows only 0 or 1
        required: true,
      },
      visibleMark: {
        type: Boolean,
        default: true,
      },
    },
    {
      timestamps: true, // Adds createdAt and updatedAt
    }
  );

  // Create the Category model
  const Category = model<ICategory>('Category', categorySchema);

  export default Category;