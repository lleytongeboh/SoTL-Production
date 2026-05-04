import authMiddleware from "../middlewares/authMiddleware";
import { Router } from "express";
import GroupController from "../controllers/groupController";
import forbiddenMiddleware, {DocumentCheckString} from "../middlewares/forbiddenMiddleware";

const GroupRouter = Router();

GroupRouter.get('/check/:batch', authMiddleware(['student']), GroupController.checkGroup);
GroupRouter.get('/getList/:batch', authMiddleware(['student', 'lecturer']), GroupController.getGroupList);
GroupRouter.post('/create', authMiddleware(['student']), GroupController.createGroup);
GroupRouter.post('/join/:group_id', authMiddleware(['student']), GroupController.joinGroup);
GroupRouter.post('/editProjectRole/:group_id', authMiddleware(['student']), forbiddenMiddleware(DocumentCheckString.GROUP), GroupController.editProjectRole);
GroupRouter.patch('/leave/:group_id', authMiddleware(['student']), forbiddenMiddleware(DocumentCheckString.GROUP), GroupController.leaveGroup);
GroupRouter.delete('/delete/:group_id', authMiddleware(['lecturer']), GroupController.deleteGroup);
GroupRouter.get('/get/:group_id', authMiddleware(['lecturer']), GroupController.getGroup);
GroupRouter.put('/edit/:group_id', authMiddleware(['student', 'lecturer']), forbiddenMiddleware(DocumentCheckString.GROUP), GroupController.editGroup);
GroupRouter.get('/getMembersMark/:group_id', authMiddleware(['lecturer']), GroupController.getMembersMark);
GroupRouter.patch('/markStudent/:student_id', authMiddleware(['lecturer']), GroupController.markStudent);

export { GroupRouter };