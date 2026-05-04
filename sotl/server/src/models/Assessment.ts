import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { AutoIncrementer } from './AutoIncrementer';
import Quiz, { IQuiz } from './Quiz';

// 0: Self-Assessment, 1: Peer Evaluation, 2: Client Evaluation
export enum AssessmentType {
  SelfAssessment = 0,
  PeerEvaluation = 1,
  ClientEvaluation = 2,
}

// Define the interface for the Assessment document
interface IAssessment extends AutoIncrementer.IAutoIncrementer {
  _id: Types.ObjectId | string;
  type: AssessmentType;
  typeLabel?: string;
  batch: mongoose.Types.ObjectId | string;
  batch_assign_all: boolean;  
  quiz_assigned: mongoose.Types.ObjectId | IQuiz; // Reference to the assigned quiz
  items_assigned: mongoose.Types.ObjectId[]; // Reference to items assigned from quiz_assigned
  groups_assigned?: mongoose.Types.ObjectId[];
  students_assigned?: mongoose.Types.ObjectId[] | string[];
  groups_excluded?: mongoose.Types.ObjectId[];
  students_excluded?: mongoose.Types.ObjectId[] | string[];
  title: string;
  description: string;
  start_at: Date;
  ended_at: Date;
  duration?: number; // Optional duration field
  public: boolean; // Indicates if the assessment is public
  shuffle: {questions: boolean, options: boolean};
  isBackNavigationAllowed: boolean;
  isPublicForReview: boolean;
  maxQuestionLimitPerPage: number;
  endedAndMarked: boolean; /// true if all assessment results for this assessment have been ended and marked (totalRewards set)
}

// Define the Assessment schema
const assessmentSchema: Schema<IAssessment> = new Schema({
  numId: { type: Number, required: false },
  type: { type: Number, enum: Object.values(AssessmentType).filter(v => !isNaN(v as any)), required: true }, // Defines the type of assessment
  quiz_assigned: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true }, // Reference to Quiz model
  items_assigned: { type: [mongoose.Schema.Types.ObjectId], ref: 'QuizItem', required: true },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  batch_assign_all: { type: mongoose.Schema.Types.Boolean, required: true },
  groups_assigned: { type: [mongoose.Schema.Types.ObjectId], ref: 'Group', required: false },
  students_assigned: { type: [mongoose.Schema.Types.ObjectId], ref: 'Student', required: false },
  groups_excluded: { type: [mongoose.Schema.Types.ObjectId], ref: 'Group', required: false },
  students_excluded: { type: [mongoose.Schema.Types.ObjectId], ref: 'Student', required: false },
  title: { type: String, required: true },
  description: { type: String, required: false },
  start_at: { type: Date, required: true },
  ended_at: { type: Date, required: true },
  duration: { type: Number, required: false },
  public: { type: mongoose.Schema.Types.Boolean, required: true },
  shuffle: { questions: { type: Boolean, required: true }, options: { type: Boolean, required: true } },
  isBackNavigationAllowed: { type: Boolean, required: true },
  isPublicForReview: { type: Boolean, required: true },
  maxQuestionLimitPerPage: { type: Number, required: true },
  endedAndMarked: { type: Boolean, required: true },
});

assessmentSchema.pre('save', AutoIncrementer.savePreMiddleware);
assessmentSchema.pre('insertMany', AutoIncrementer.insertManyPreMiddleware);

// Create the Assessment model
const Assessment: Model<IAssessment> = mongoose.model<IAssessment>('Assessment', assessmentSchema);

export default Assessment;
export { IAssessment, assessmentSchema };   