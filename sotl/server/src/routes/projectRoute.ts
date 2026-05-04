import authMiddleware from "../middlewares/authMiddleware";
import { Router } from "express";
import ProjectController from "../controllers/projectController";
import multerMiddleware from "../middlewares/multerMiddleware";
import forbiddenMiddleware, {DocumentCheckString} from "../middlewares/forbiddenMiddleware";

const ProjectRouter = Router();

ProjectRouter.post('/getList', authMiddleware(['lecturer']), ProjectController.getProjectList);
ProjectRouter.get('/check/:group_id', authMiddleware(['student']), ProjectController.checkProject);
ProjectRouter.post('/create', authMiddleware(['student']), ProjectController.createProject);
ProjectRouter.post('/edit/:project_id', authMiddleware(['student', 'lecturer']), forbiddenMiddleware(DocumentCheckString.PROJECT), ProjectController.editProject);
ProjectRouter.get('/get/:project_id', authMiddleware(['lecturer']), ProjectController.getProject);
ProjectRouter.patch('/mark/:project_id', authMiddleware(['lecturer']), ProjectController.markProject);
ProjectRouter.post('/submitDeliverable/:project_id/:deliverable_id', authMiddleware(['student']), forbiddenMiddleware(DocumentCheckString.PROJECT), multerMiddleware(), ProjectController.submitDeliverable);
ProjectRouter.post('/downloadDeliverable/:project_id/:deliverable_id', authMiddleware(['student', 'lecturer']), forbiddenMiddleware(DocumentCheckString.PROJECT), ProjectController.downloadDeliverable);
ProjectRouter.delete('/deleteDeliverable/:project_id/:deliverable_id', authMiddleware(['student', 'lecturer']), forbiddenMiddleware(DocumentCheckString.PROJECT), ProjectController.deleteDeliverable);
ProjectRouter.patch('/updateDeliverableStatus/:project_id/:deliverable_id', authMiddleware(['lecturer']), forbiddenMiddleware(DocumentCheckString.PROJECT), ProjectController.updateDeliverableStatus);

export { ProjectRouter };