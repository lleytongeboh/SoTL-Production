import mongoose, { Document, Schema, Types } from 'mongoose';

namespace JobData {
  export interface IJobData {
    type: number;
  }

  export interface ISendClientEvaluationEmail extends IJobData {
    type: 4;
    assessmentResultId: Types.ObjectId;
    assessmentNumId: number;
    clientId: Types.ObjectId;
    clientName: string;
    clientEmail: string;
    clientAccessCode: string;
  }
}

// Define an interface for the job document
interface IJob extends Document {
  jobId?: string;
  type: 0 | 1 | 5; // 0 for student create, 1- Resent Student Email (), 2 - Forgot Password Send, 3 - Reset Password, 4 - Evaluation, 5 - for deliverable deleted, 
  status: 'pending' | 'completed' | 'failed';
  jobContent: string,
  batch?: string | null;
  assessmentResultId?: Types.ObjectId;
  error?: string | null; // error is optional
  userId: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date; // new field from timestamps
}

// Create the job schema with timestamps enabled
const jobSchema: Schema<IJob> = new Schema(
  {
    jobId: { type: String, required: false },
    jobContent: { type: String, required: true },
    type: { type: Number, enum: [0, 1, 2, 3, 4, 5], required: true },
    batch: { type: String, default: null },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    assessmentResultId: { type: Schema.Types.ObjectId, required: false },
    status: { type: String, enum: ['pending', 'completed', 'failed'], required: true },
    error: { type: String, default: null },
  },
  { timestamps: true } // Enable timestamps
);

// Create the job model
const JobModel = mongoose.model<IJob>('Job', jobSchema);

export default JobModel;
export { IJob, JobData }