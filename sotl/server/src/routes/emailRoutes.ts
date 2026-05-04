import authMiddleware from "../middlewares/authMiddleware";
import { Router } from "express";
import emailController from "../controllers/emailController";
import { UserRoles } from "../utils/enums/UserRoles";

const EmailRouter = Router();

EmailRouter.post('/test', authMiddleware([UserRoles.LECTURER, UserRoles.STUDENT]), emailController.testEmailSend);
EmailRouter.post('/test-client', authMiddleware([UserRoles.LECTURER, UserRoles.STUDENT]), emailController.testEmailSendClient);

export { EmailRouter };