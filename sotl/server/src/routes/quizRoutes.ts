import authMiddleware from "../middlewares/authMiddleware";
import { Router } from "express";
import { QuizController } from "../controllers/quizController";

const QuizRouter = Router();

QuizRouter.get('/', authMiddleware(['lecturer']),  QuizController.getQuizList);
QuizRouter.get('/:quiz_id/questions', authMiddleware(['lecturer']), QuizController.getItemList);
QuizRouter.get('/:quiz_id', authMiddleware(['lecturer']), QuizController.getQuiz);
QuizRouter.post('/', authMiddleware(['lecturer']), QuizController.createQuiz);
QuizRouter.put('/:quiz_id', authMiddleware(['lecturer']), QuizController.updateQuiz);
QuizRouter.delete('/:quiz_id', authMiddleware(['lecturer']), QuizController.deleteQuiz);

export { QuizRouter };