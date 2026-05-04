import authMiddleware from "../middlewares/authMiddleware";
import { Router } from "express";
import { AssessmentController } from "../controllers/assessmentController";

const AssessmentRouter = Router();

AssessmentRouter.get('/', authMiddleware(['lecturer']), AssessmentController.getAssessmentList);
AssessmentRouter.get('/batchlist', authMiddleware(['lecturer']), AssessmentController.getBatchList);
AssessmentRouter.get('/grouplist', authMiddleware(['lecturer']), AssessmentController.getGroupList);
AssessmentRouter.get('/studentlist', authMiddleware(['lecturer']), AssessmentController.getStudentList);
AssessmentRouter.get('/:assessment_id', authMiddleware(['lecturer']), AssessmentController.getAssessment);
AssessmentRouter.post('/', authMiddleware(['lecturer']), AssessmentController.createAssessment);
AssessmentRouter.put('/:assessment_id', authMiddleware(['lecturer']), AssessmentController.editAssessment);
AssessmentRouter.delete('/:assessment_id', authMiddleware(['lecturer']), AssessmentController.deleteAssessment);

export { AssessmentRouter };