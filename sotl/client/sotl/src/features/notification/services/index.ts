// services/notificationService.ts
import { standardApi } from '../../../utils/standardApi'; // Adjust the import path as necessary
import { API_BASE_URL } from '../../../configs/sotl-config';
import { ApiResponse } from '../../../models';
import { Notifications } from '../models';
import { extractUnreadNotificationIds } from '../utils';
/**
 * Marks a notification as read by sending a request to the backend.
 * @param {string} notificationId - The ID of the notification to mark as read.
 * @returns {void} - Triggers the API request to mark the notification as read.
 */
export const markNotificationAsRead = (notificationId: string): Promise<ApiResponse<Notifications>> => {
  return standardApi<Notifications>(
    `${API_BASE_URL}/api/notifications/${notificationId}/read`,
    'PATCH',
    true
  );
};

/**
 * Marks all notifications as read by sending a request to the backend.
 * @returns {void} - Triggers the API request to mark all notifications as read.
 */
export const markAllNotificationsAsRead = (notification: Notifications): Promise<ApiResponse<Notifications>> => {
  return standardApi<Notifications>(
    `${API_BASE_URL}/api/notifications/read/all`,
    'PUT', 
    true,
    {'notifications':extractUnreadNotificationIds(notification)}
  );
};