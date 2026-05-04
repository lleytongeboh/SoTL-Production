import { Router } from 'express';
import { getNotifications, createNotification, markAsRead, markAllAsRead } from '../controllers/NotificationController';
import authMiddleware from '../middlewares/authMiddleware';
import { UserRoles } from '../utils/enums/UserRoles';

const NotificationRouter = Router();

NotificationRouter.get('/', authMiddleware([UserRoles.LECTURER, UserRoles.STUDENT]), getNotifications); // GET /notification
NotificationRouter.post('/', authMiddleware([UserRoles.LECTURER, UserRoles.STUDENT]), createNotification); // POST /notification
NotificationRouter.patch('/:id/read', authMiddleware([UserRoles.LECTURER, UserRoles.STUDENT]), markAsRead); // PATCH /notification/:id/read
NotificationRouter.put('/read/all', authMiddleware([UserRoles.LECTURER, UserRoles.STUDENT]), markAllAsRead); // PUT /notification/read-all

export { NotificationRouter };