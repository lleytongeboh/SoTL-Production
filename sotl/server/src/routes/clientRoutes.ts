import authMiddleware from "../middlewares/authMiddleware";
import { Router } from "express";
import { AssessmentResultController } from "../controllers/assessmentResultController";

const ClientRouter = Router();

ClientRouter.get('/:client_id/access_code', authMiddleware(['lecturer']), AssessmentResultController.getClientAssessmentAccessCode);

export { ClientRouter };