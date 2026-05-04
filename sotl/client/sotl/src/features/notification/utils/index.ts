import { Notifications } from '../models';

export const extractUnreadNotificationIds = (notifications: Notifications): string[] => {
    return notifications?.filter((notification) => !notification.read).map((notification) => notification._id) || [];
} 