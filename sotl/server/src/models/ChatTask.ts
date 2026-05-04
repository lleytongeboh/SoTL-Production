import mongoose, { Schema, Types } from "mongoose";

export type ChatTaskStatus = "assigned" | "in_progress" | "done" | "cancelled";

export interface IChatTask {
  projectId: Types.ObjectId;

  createdBy: Types.ObjectId;   // leader
  assignedTo: Types.ObjectId;  // member

  title: string;
  description?: string;
  relatedDeliverable?: string;

  status: ChatTaskStatus;

  dueAt: Date;

  evidenceLink?: string;
  note?: string;

  createdAt: Date;
  updatedAt: Date;

  completedAt?: Date | null;
  cancelledAt?: Date | null;
}

const ChatTaskSchema = new Schema<IChatTask>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: "", trim: true, maxlength: 2000 },
    relatedDeliverable: { type: String, default: "", trim: true, maxlength: 200 },

    status: {
      type: String,
      enum: ["assigned", "in_progress", "done", "cancelled"],
      default: "assigned",
      index: true,
    },

    dueAt: { type: Date, required: true, index: true },

    evidenceLink: { type: String, default: "", trim: true, maxlength: 2000 },
    note: { type: String, default: "", trim: true, maxlength: 2000 },

    completedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Helpful compound indexes
ChatTaskSchema.index({ projectId: 1, createdBy: 1, dueAt: 1 });
ChatTaskSchema.index({ projectId: 1, assignedTo: 1, dueAt: 1 });

export const ChatTask =
  mongoose.models.ChatTask || mongoose.model<IChatTask>("ChatTask", ChatTaskSchema);
