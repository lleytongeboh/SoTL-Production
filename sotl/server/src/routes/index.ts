import { Router, Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import deadlinesRoutes from './deadlinesRoutes';

import LoginController from "../controllers/authController";
import authMiddleware from "../middlewares/authMiddleware";

// Named routers (leave exports if other files import them directly)
export { NotificationRouter } from "./NotificationRoutes";
export { GroupRouter } from "./groupRoute";
export { ProjectRouter } from "./projectRoute";
export { DeliverablesRouter } from "./deliverablesRoutes";
export { TodoListRouter } from "./todoListRoutes";
export { UserManagementRouter } from "./userManagementRoutes";
export { EmailRouter } from "./emailRoutes";
export { ProfileRouter } from "./profileRoutes";
export { GamificationRouter } from "./gamificationRoutes";
export { QuizRouter } from "./quizRoutes";
export { AssessmentRouter } from "./assessmentRoutes";
export { AssessmentResultRouter } from "./assessmentResultRoutes";
export { ClientRouter } from "./clientRoutes";
export { default as uploadRoutes } from "./uploadRoutes";

// 👇 LLM router
import LLMRouter from "./llmRoutes";

interface AuthRequest extends Request {
  user?: { role: string } & JwtPayload;
}

const router = Router();

/* ---- Auth endpoints (your originals) ---- */
router.post("/login", LoginController.login);

router.get("/test/student", authMiddleware(["student"]), (_req: AuthRequest, res: Response) =>
  res.json({ message: "[Msg] Welcome, Student!" })
);
router.get("/test/admin", authMiddleware(["admin"]), (_req: AuthRequest, res: Response) =>
  res.json({ message: "[Msg] Welcome, Admin!" })
);
router.get("/test/client", authMiddleware(["client"]), (_req: AuthRequest, res: Response) =>
  res.json({ message: "[Msg] Welcome, Client!" })
);

router.get("/validate-token", authMiddleware([]), LoginController.validateTokenController);
router.post("/send-otp", LoginController.sendUserOtp);
router.post("/verify-otp", LoginController.verifyOtp);
router.post("/change-password", LoginController.changePassword);

/* ---- Mount feature routers here ---- */
router.use("/llm", LLMRouter); // -> /api/llm/*
router.use('/deadlines', deadlinesRoutes);

export default router;
