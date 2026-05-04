// src/controllers/notification.controller.ts
import { Request, Response } from 'express';
import * as NotificationService from '../services/NotificationService';
import { successResponse, errorResponse } from '../utils/response';
import mongoose from 'mongoose';
import { JwtPayload } from "jsonwebtoken";

interface CustomRequest extends Request {
  user?: { role: string; userId: mongoose.Types.ObjectId } & JwtPayload; // Adjust this type based on your JWT payload structure
}
// Get all notifications
export const getNotifications = async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.user?.userId?.toString();
    const role = req.user?.role;
    if (!userId) {
      throw new Error('User ID not found in the request');
    }
    if(!role) {
      throw new Error('Role not found in the request');
    }
    const notifications = await NotificationService.getAllNotifications(userId, role);
    res.status(200).json(successResponse(notifications, 'Notifications fetched successfully.'));
  } catch (error: any) {
    res
      .status(500)
      .json(errorResponse('Failed to fetch notifications', error.message));
  }
};

// Create a new notification
export const createNotification = async (req: CustomRequest, res: Response) => {
  try {
    let newNotification;
    const role = req.user?.role;
    if(!role ){
      throw new Error('Role not found in the request');
    }
    if(role === 'student'){
      newNotification = await NotificationService.createNewNotification({...req.body});
    }else if(role === 'lecturer'){
      newNotification = await NotificationService.createNewNotification(req.body);
    }
    
    res.status(201).json(successResponse(newNotification, 'Notification created successfully.'));
  } catch (error: any) {
    res
      .status(500)
      .json(errorResponse('Failed to create notification', error.message));
  }
};

// Mark a notification as read
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const notification = await NotificationService.markNotificationAsRead(req.params.id);
    res.status(200).json(successResponse(notification, 'Notification marked as read.'));
  } catch (error: any) {
    res
      .status(500)
      .json(errorResponse('Failed to mark notification as read', error.message));
  }
};

export const markAllAsRead = async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.user?.userId?.toString();
    if (!userId) {
      throw new Error('User ID not found in the request');
    }
    const notifications = await NotificationService.markAllNotificationsAsRead(userId);
    res.status(200).json(successResponse(notifications, 'All notifications marked as read.'));
  } catch (error: any) {
    res
      .status(500)
      .json(errorResponse('Failed to mark all notifications as read', error.message));
  }
}