import mongoose, { Schema, Document, Model, Types, SchemaDefinitionProperty } from "mongoose";
import { RewardType } from "./Quiz";

// 0 - multi-choice, 1 - likert scale, 2 - open-ended, 3 - page break
enum QuizItemType {
  MCQ = 0,
  LIKERT = 1,
  OEQ = 2,
  PAGE_BREAK = 3
}

interface IQuizItem extends Document {
  _id: mongoose.Types.ObjectId | string;
  type: QuizItemType;
  isQuestion: boolean;
}

interface INonQuestion extends IQuizItem {
  isQuestion: false;
}

interface IQuestion extends IQuizItem {
  topic?: string;
  title: string;
  options: { _id: Types.ObjectId | string; label: string, correctAnswer?: boolean }[];
  rewards?: {[RewardType.POINT]: number, [RewardType.SCORE]: number};
  isQuestion: true;
  required: boolean;
}

interface IMultiChoiceQuestion extends IQuestion {
  type: QuizItemType.MCQ;
}

interface ILikertQuestion extends IQuestion {
  type: QuizItemType.LIKERT;
  likert_statements?: { _id: Types.ObjectId | string; label: string }[];
}

interface IOpenEndQuestion extends IQuestion {
  type: QuizItemType.OEQ;
  multiline: boolean;
}

interface IPageBreak extends IQuizItem {
  type: QuizItemType.PAGE_BREAK;
}

type Question =
  | IMultiChoiceQuestion
  | ILikertQuestion
  | IOpenEndQuestion

type QuizItem =
  | IQuizItem
  | IPageBreak;

// ensure a question can still be rendered properly even if the original option cannot be found  
const createUnknownOptions = (options: Types.ObjectId[]) => {
  return options.map((oId) => ({ _id: oId, label: oId } as unknown as IQuestion['options'][number]));
}

// ensure a question can still be rendered properly even if the original question cannot be found
const createUnknownQuestion = (_id: IQuizItem['_id'], options?: IQuestion['options'][number]['_id'][]): IQuizItem => {
  const unknownQuestion = {
    _id: _id,
    title: _id,
    isQuestion: true,
  } as unknown as IQuestion;
  
  if(Array.isArray(options)) {
    unknownQuestion.type = QuizItemType.MCQ;
    unknownQuestion.options = createUnknownOptions(options as Types.ObjectId[]);
  } else {
    unknownQuestion.type = QuizItemType.OEQ;
  }

  return unknownQuestion;
};

const questionTypeSchema: SchemaDefinitionProperty = { type: Number, enum: Object.values(QuizItemType).filter(v => !isNaN(v as any)), required: true };

const questionSchema: Schema = new Schema<Question & { likert_statements: ILikertQuestion['likert_statements']}>({
  type: questionTypeSchema,
  isQuestion: { type: Schema.Types.Boolean, required: true },
  topic: { type: String, required: false },
  title: { type: String, required: true },
  // `options` is only for questions that are multiple-choice (when `type` matches certain criteria, e.g., 1)
  options: [
    {
      label: { type: String, required: false },
      correctAnswer: { type: Schema.Types.Boolean, required: false }
    },
  ],
  // `likert_statements` is only for Likert scale questions (when `type` matches certain criteria, e.g., 2)
  likert_statements: [
    {
      label: { type: String, required: false },
    },
  ],
  rewards: {[RewardType.POINT]: { type: Number, required: false }, [RewardType.SCORE]: { type: Number, required: false }},
  required: { type: Schema.Types.Boolean, required: true },
  multiline: { type: Schema.Types.Boolean, required: false },
});

const quizItemSchema: Schema = new Schema<QuizItem>({
  type: questionTypeSchema,
  isQuestion: { type: Schema.Types.Boolean, required: true },
});

// Create the QuizItem and Question model
// const QuizItemModel: Model<QuizItem> = mongoose.model<QuizItem>('QuizItem', quizItemSchema);
const QuestionModel: Model<Question> = mongoose.model<Question>('QuizItem', questionSchema);

export { createUnknownOptions, createUnknownQuestion, QuizItemType, IQuizItem, IQuestion, IMultiChoiceQuestion, ILikertQuestion, IOpenEndQuestion, Question, QuizItem, questionSchema, quizItemSchema, QuestionModel };
