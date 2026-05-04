import authMiddleware from "../middlewares/authMiddleware";
import { Router } from "express";
import UserManagementController from "../controllers/userManagementController";
import { UserRoles } from "../utils/enums/UserRoles";

const UserManagementRouter = Router();

UserManagementRouter.get('/batch-student/all', authMiddleware([UserRoles.LECTURER]), UserManagementController.getAllBatchStudent);
UserManagementRouter.get('/batch-list', authMiddleware([UserRoles.LECTURER]), UserManagementController.getBatchCategory);
UserManagementRouter.delete('/category/:id', authMiddleware([UserRoles.LECTURER]), UserManagementController.removeCategory);
UserManagementRouter.patch('/category/:id', authMiddleware([UserRoles.LECTURER]), UserManagementController.editCategoryName);
UserManagementRouter.post('/batch', authMiddleware([UserRoles.LECTURER]), UserManagementController.addBatchCategory);
UserManagementRouter.post('/custom-category', authMiddleware([UserRoles.LECTURER]), UserManagementController.addCustomCategory);
UserManagementRouter.patch('/category/:id/visible-mark', authMiddleware([UserRoles.LECTURER]), UserManagementController.editCategoryVisibleMark);
UserManagementRouter.get('/lecturer/student/:id', authMiddleware([UserRoles.LECTURER]), UserManagementController.getStudent);
UserManagementRouter.post('/student', authMiddleware([UserRoles.LECTURER]), UserManagementController.addStudentManually);
UserManagementRouter.post('/students/bulk', authMiddleware([UserRoles.LECTURER]), UserManagementController.addStudentsBulk);
UserManagementRouter.get('/category/:id/bulk/log', authMiddleware([UserRoles.LECTURER]), UserManagementController.getStudentsBulkLog);
UserManagementRouter.delete('/student/bulk/:id', authMiddleware([UserRoles.LECTURER]), UserManagementController.removeStudentBulkLog);
UserManagementRouter.put('/student/:id', authMiddleware([UserRoles.LECTURER]), UserManagementController.editStudent);
UserManagementRouter.get('/client/:id', authMiddleware([UserRoles.LECTURER]), UserManagementController.getClient);
UserManagementRouter.delete('/student/:id', authMiddleware([UserRoles.LECTURER]), UserManagementController.removeStudent);
UserManagementRouter.get('/client', authMiddleware([UserRoles.LECTURER]), UserManagementController.getClientList);
UserManagementRouter.get('/group-info', authMiddleware([UserRoles.LECTURER]), UserManagementController.getGroupProjectList);
UserManagementRouter.get('/client/:id/evaluation-link', authMiddleware([UserRoles.LECTURER]), UserManagementController.sendEmailClientEvaluation);
UserManagementRouter.post('/client', authMiddleware([UserRoles.LECTURER]), UserManagementController.addClient);
UserManagementRouter.delete('/client/:id', authMiddleware([UserRoles.LECTURER]), UserManagementController.removeClient);
UserManagementRouter.put('/client/:id', authMiddleware([UserRoles.LECTURER]), UserManagementController.editClient);
UserManagementRouter.get('/student/:studentId/email-resend', authMiddleware([UserRoles.LECTURER]), UserManagementController.resendStudentEmail);
UserManagementRouter.post('/student/:studentId/self-assessment', authMiddleware([UserRoles.LECTURER]), UserManagementController.getSelfAssessmentResult);
UserManagementRouter.post('/student/:studentId/peer-assessment', authMiddleware([UserRoles.LECTURER]), UserManagementController.getPeerAssessmentResult);    
UserManagementRouter.post('/group/:groupId/client-evaluation', authMiddleware([UserRoles.LECTURER]), UserManagementController.getClientEvaluationResult);
UserManagementRouter.delete('/assessmentResult/:id', authMiddleware([UserRoles.LECTURER]), UserManagementController.removeAssessmentResult);
//test
UserManagementRouter.post('/student-registration', authMiddleware([UserRoles.LECTURER]), UserManagementController.addStudentToJob);

export { UserManagementRouter };