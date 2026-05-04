export enum JobStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    FAILED = 'failed'
}

export interface IJob {
    _id: string;
    type: 0 | 1; // 0 for student create, 1- Resent Student Email (), 2 - Forgot Password Send, 3 - Reset Password, 4 - Evaluation, 5 - for deliverable deleted, 
    status: JobStatus;
    jobContent: string,
    batch?: string | null;
    assessmentResultId?: string;
    error?: string | null; // error is optional
    createdAt: Date | string;
    updatedAt: Date | string; // new field from timestamps
  }