import authMiddleware from "../middlewares/authMiddleware";
import { Router } from "express";
import ProfileController from "../controllers/profileController";
import { UserRoles } from "../utils/enums/UserRoles";

const ProfileRouter = Router();

ProfileRouter.put('/student', authMiddleware([UserRoles.STUDENT]), ProfileController.updateStudentProfile);
ProfileRouter.put('/lecturer', authMiddleware([UserRoles.LECTURER]), ProfileController.updateLecturerProfile);
ProfileRouter.get('/student/:studentId', authMiddleware([UserRoles.STUDENT]), ProfileController.getStudentProfile);
ProfileRouter.put('/change-batch', authMiddleware([UserRoles.STUDENT]), ProfileController.changeLoginAsBatch);

export { ProfileRouter };