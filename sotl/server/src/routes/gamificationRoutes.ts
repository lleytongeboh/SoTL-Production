import authMiddleware from "../middlewares/authMiddleware";
import { Router } from "express";
import GamificationController from "../controllers/gamificationController";
import { UserRoles } from "../utils/enums/UserRoles";

const GamificationRouter = Router();

GamificationRouter.get('/badge-list', authMiddleware([UserRoles.LECTURER, UserRoles.STUDENT]), GamificationController.getBadgeList);
GamificationRouter.get('/badge/:badgeId', authMiddleware([UserRoles.LECTURER]), GamificationController.getBadge);
GamificationRouter.put('/badge/:badgeId', authMiddleware([UserRoles.LECTURER]), GamificationController.updateBadge);
GamificationRouter.post('/badge', authMiddleware([UserRoles.LECTURER]), GamificationController.createBadge);
GamificationRouter.put('/badge-order', authMiddleware([UserRoles.LECTURER]), GamificationController.updateBadgeOrderAndRemoveBadge);
GamificationRouter.get('/leaderboard', authMiddleware([UserRoles.LECTURER, UserRoles.STUDENT]), GamificationController.getLeaderboard);

export { GamificationRouter };