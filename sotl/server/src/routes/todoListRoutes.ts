import authMiddleware from "../middlewares/authMiddleware";
import { Router } from "express";
import TodoListController from "../controllers/todoListController";
import multer from "multer";
import forbiddenMiddleware, {DocumentCheckString} from "../middlewares/forbiddenMiddleware";

const TodoListRouter = Router();

TodoListRouter.get('/getList/:project_id', authMiddleware(['student', 'lecturer']), forbiddenMiddleware(DocumentCheckString.PROJECT), TodoListController.getTodosAndSprint);
TodoListRouter.get('/getSprintTodo/:sprint_id', authMiddleware(['student', 'lecturer']), forbiddenMiddleware(DocumentCheckString.SPRINT), TodoListController.getSprintTodo);
TodoListRouter.post('/createTodo/:project_id', authMiddleware(['student']), forbiddenMiddleware(DocumentCheckString.PROJECT), multer({ limits: { fieldSize: 20 * 1024 * 1024 } }).none(), TodoListController.createTodo);
TodoListRouter.post('/createSprint/:project_id', authMiddleware(['student']), forbiddenMiddleware(DocumentCheckString.PROJECT), multer({ limits: { fieldSize: 20 * 1024 * 1024 } }).none(), TodoListController.createSprint);
TodoListRouter.get('/getSingleTodo/:project_id/:todo_id/', authMiddleware(['student', 'lecturer']), forbiddenMiddleware(DocumentCheckString.PROJECT), TodoListController.getSingleTodo);
TodoListRouter.post('/createComment/:project_id/:todo_id', authMiddleware(['student']), forbiddenMiddleware(DocumentCheckString.PROJECT), multer({ limits: { fieldSize: 20 * 1024 * 1024 } }).none(), TodoListController.createComment);
TodoListRouter.put('/editComment/:comment_id', authMiddleware(['student']), forbiddenMiddleware(DocumentCheckString.COMMENT), multer({ limits: { fieldSize: 20 * 1024 * 1024 } }).none(), TodoListController.editComment);
TodoListRouter.delete('/deleteComment/:comment_id', authMiddleware(['student']), forbiddenMiddleware(DocumentCheckString.COMMENT), TodoListController.deleteComment);
TodoListRouter.put('/editTodo/:project_id/:todo_id', authMiddleware(['student']), forbiddenMiddleware(DocumentCheckString.PROJECT), multer({ limits: { fieldSize: 20 * 1024 * 1024 } }).none(), TodoListController.editTodo);
TodoListRouter.delete('/deleteTodo/:project_id/:todo_id', authMiddleware(['student']), forbiddenMiddleware(DocumentCheckString.PROJECT), TodoListController.deleteTodo);
TodoListRouter.get('/getGantt/:project_id', authMiddleware(['student', 'lecturer']), forbiddenMiddleware(DocumentCheckString.PROJECT), TodoListController.getGantt);

export { TodoListRouter };