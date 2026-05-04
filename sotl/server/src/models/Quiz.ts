import mongoose, { Schema, Document, Model } from "mongoose";
import { AutoIncrementer } from "./AutoIncrementer";
import { IQuestion } from "./QuizItem";

enum RewardType {
  POINT = 0,
  SCORE = 1
}

// Define the interface for the Quiz document
interface IQuiz extends AutoIncrementer.IAutoIncrementer {
  type: number; // 0 - individual assessment, 1 - Peer Evaluation, 2 - Group Evaluation
  title: string;
  description: string;
  items: mongoose.Types.ObjectId[] | IQuestion[];
  itemsUsedInAssessment?: any;
  rewards: {
    [RewardType.POINT]: boolean;
    [RewardType.SCORE]: boolean;
  };
}

// Define the Quiz schema
const quizSchema: Schema<IQuiz> = new Schema({
  numId: { type: Number, required: false },
  type: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  items: { type: [mongoose.Schema.Types.ObjectId], ref: 'QuizItem', required: true },
  rewards: { [RewardType.POINT]: { type: mongoose.Schema.Types.Boolean, required: true }, [RewardType.SCORE]: { type: mongoose.Schema.Types.Boolean, required: true } }
}, { timestamps: true });

quizSchema.pre('save', AutoIncrementer.savePreMiddleware);
quizSchema.pre('insertMany', AutoIncrementer.insertManyPreMiddleware);

/* quizSchema.post('insertMany', async function (docs: any[], next) {
  const nextId = await getLastNumId() + 1;
  for(const doc of docs) {
    doc.numId = nextId + 1;
  }
  next();
}); */

// Create the Quiz model
const Quiz: Model<IQuiz> = mongoose.model<IQuiz>("Quiz", quizSchema);

export default Quiz;
export { RewardType, IQuiz, quizSchema };
