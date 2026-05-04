import authMiddleware from "../middlewares/authMiddleware";
import { Router } from "express";
import { AssessmentController } from "../controllers/assessmentController";
import { AssessmentResultController } from "../controllers/assessmentResultController";

const AssessmentResultRouter = Router();

AssessmentResultRouter.get('/mylist', authMiddleware(['student']), AssessmentResultController.getMyAssessmentList);
AssessmentResultRouter.post('/emails', authMiddleware(['lecturer']), AssessmentResultController.sendClientEmail);
AssessmentResultRouter.post('/', authMiddleware(['lecturer']), AssessmentResultController.getAssessmentResultList);
AssessmentResultRouter.post('/remark', authMiddleware(['lecturer']), AssessmentResultController.remarkAssessmentResults); // recalculate AssessmentResult.totalRewards
AssessmentResultRouter.get('/:assessment_id', authMiddleware([], true), AssessmentResultController.getAssessment);
AssessmentResultRouter.get('/:assessment_id/pages/:page_num', authMiddleware([], true), AssessmentResultController.getAssessmentPage);
AssessmentResultRouter.put('/:assessment_id/pages/:page_num', authMiddleware([], true), AssessmentResultController.saveAssessmentPage);
AssessmentResultRouter.put('/:assessment_id/start', authMiddleware([], true), AssessmentResultController.startAssessments);
AssessmentResultRouter.put('/:assessment_id/end', authMiddleware([], true), AssessmentResultController.endAssessments);
AssessmentResultRouter.delete('/:assessment_result_id', authMiddleware(['lecturer']), AssessmentResultController.deleteAssessmentResult);
AssessmentResultRouter.post('/deleteMany', authMiddleware(['lecturer']), AssessmentResultController.deleteManyAssessmentResult);

export { AssessmentResultRouter };