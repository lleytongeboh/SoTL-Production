import mongoose, { Schema, Document, Model, Types, SchemaDefinition, SchemaDefinitionType } from "mongoose";
import { IAssessment } from "./Assessment";
import { IQuizItem } from "./QuizItem";
import { IStudent } from "./Student";
import { IGroup } from "./Group";
import { IQuiz, RewardType } from "./Quiz";

export enum EvaluatorType {
  STUDENT = 1,
  CLIENT = 2
}

interface IAssessmentResultPageSubmittedResponse {
  _id: mongoose.Types.ObjectId | string;
  response?: mongoose.Types.ObjectId | string | null; // The actual response given by the evaluator (QuizItem.Option._id)
  likert_response?: Types.Map<Types.ObjectId | string>;
  op_answer?: string; // Optional open-ended response
}

export interface IAssessmentResultPageSubmitted {
  _id?: Types.ObjectId | string;
  responses: IAssessmentResultPageSubmittedResponse[];
}

interface IAssessmentResultPageResponse extends IAssessmentResultPageSubmittedResponse {
  quizItem: mongoose.Types.ObjectId | IQuizItem; // Reference to the question ID
  options?: mongoose.Types.ObjectId[];
  // correct?: boolean; // Optional attribute for marking correctness
  rewards: {[RewardType.POINT]: number, [RewardType.SCORE]: number}; // rewards awarded for the response
  completed: boolean;
  // deleted: boolean; // soft deletion
  questionNum?: number;
}

export interface IAssessmentResultPage extends IAssessmentResultPageSubmitted {
  pageNum: number;
  responses: IAssessmentResultPageResponse[];
  completed: boolean;
}

// Define the interface for the AssessmentResult document
export interface IAssessmentResult extends Document {
  _id: Types.ObjectId;
  pages: IAssessmentResultPage[];
  currentPage?: number;
  evaluator: {
    name?: string; // populated from user
    label?: string; // dynamically generated from user (e.g. name + matric number)
    type: EvaluatorType; // Type of evaluator
    evaluator_id: mongoose.Types.ObjectId | string; // Reference to evaluator ID (student id for both self assessment and peer evaluation; client id for client evaluation)
    access_code?: string; // access code for client evaluation
  };  
  evaluatee?: mongoose.Types.ObjectId | IStudent | IGroup | string; // sutdent id in peer evaluation or group id in client evaluation
  assessment: mongoose.Types.ObjectId | IAssessment; // Reference to the assessment ID
  startedAt?: Date;
  endedAt?: Date;
  completed: boolean; // true when all required questions have been completed, even if any optional question is not complete
  duration?: string;
  serverClock?: Date;
  questionCount?: number;
  lastPage?: number;
  canSubmit?: boolean;
  totalRewards?: {[RewardType.POINT]: number, [RewardType.SCORE]: number}; // total rewards awarded for this submission
  order?: number; // the correct order when result is sorted in an array
}

// IAssessmentResultMultiple is used because in a peer evaluation, there is one assessment result for each evaluatee evaluated
export interface IAssessmentResultMultiple {
  quiz?: IQuiz;
  results: IAssessmentResult[];
  canSubmitAll: boolean; // true if all results' canSubmit is true
}

const assessmentResultPageSubmittedSchemaDefinition: SchemaDefinition<SchemaDefinitionType<IAssessmentResultPageSubmitted>, IAssessmentResultPageSubmitted> = {
  responses: [
    {
      response: { type: mongoose.Schema.Types.ObjectId, required: false },
      likert_response: { type: mongoose.Schema.Types.Map, of: mongoose.Schema.Types.ObjectId, required: false },
      op_answer: { type: String, required: false },
    },
  ]
};

const assessmentResultPageSubmittedSchema: Schema<IAssessmentResultPageSubmitted> = new Schema(assessmentResultPageSubmittedSchemaDefinition, {autoCreate: false});

export const assessmentResultPageSchema: Schema<IAssessmentResultPage> = new Schema({
    pageNum: { type: Number, required: true },
    responses: [
      {
        ...(assessmentResultPageSubmittedSchemaDefinition.responses as any[])[0],
        quizItem: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizItem', required: true },
        options: { type: [mongoose.Schema.Types.ObjectId], required: false },
        // correct: { type: Number, required: false },
        rewards: {[RewardType.POINT]: { type: Number, required: true }, [RewardType.SCORE]: { type: Number, required: true }},
        completed: { type: Boolean, required: true },
        // deleted: { type: Boolean, required: true },
      },
    ],
    completed: { type: Boolean, required: true }
});

// Define the AssessmentResult schema
export const assessmentResultSchema: Schema<IAssessmentResult> = new Schema({
  pages: [assessmentResultPageSchema],
  evaluator: {
    type: {
      type: Number,
      enum: Object.values(EvaluatorType).filter(v => !isNaN(v as any)),
      required: true,
    },
    evaluator_id: { type: mongoose.Schema.Types.ObjectId, refPath: 'evaluator.type', required: true },
    access_code: { type: String, required: false, unique: true, sparse: true }, // sparse is required to ensure multiple null values won't trigger unique error
  },
  evaluatee: { type: mongoose.Schema.Types.ObjectId, ref: 'Evaluatee', required: false },
  assessment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
  startedAt: { type: mongoose.Schema.Types.Date, required: false },
  endedAt: { type: mongoose.Schema.Types.Date, required: false },
  completed: { type: Boolean, required: true },
  totalRewards: {[RewardType.POINT]: { type: Number, required: false }, [RewardType.SCORE]: { type: Number, required: false }},
});

export const AssessmentResultSubmittedPage: Model<IAssessmentResultPageSubmitted> = mongoose.model<IAssessmentResultPageSubmitted>('AssessmentResultPageSubmitted', assessmentResultPageSubmittedSchema);

// Create the AssessmentResult model
const AssessmentResult: Model<IAssessmentResult> = mongoose.model<IAssessmentResult>('AssessmentResult', assessmentResultSchema);

export default AssessmentResult;