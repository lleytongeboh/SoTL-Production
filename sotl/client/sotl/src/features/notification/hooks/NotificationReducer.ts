import { NotificationState, Action } from '../models';

export const notificationReducer = (state: NotificationState, action: Action): NotificationState => {
  switch (action.type) {
    case "FETCH_INIT":
      return { ...state, loading: true, error: null };
    case "FETCH_SUCCESS":
      return { ...state, loading: false, notifications: action.payload };
    case "FETCH_FAILURE":
      return { ...state, loading: false, error: action.payload };
    case "ADD_NOTIFICATION":
      // Check if notification already exists and update or add it
      const updatedNotifications = state.notifications??[];
      const existingIndex = updatedNotifications.findIndex(
        (n) => n._id === action.payload._id
      );
      console.log('existingIndex: ', existingIndex);
      console.log('action.payload: ', action.payload);
      if (existingIndex !== -1) {
        updatedNotifications[existingIndex] = action.payload;
        console.log("add: "+1);
      } else {
        updatedNotifications.unshift(action.payload);
        console.log("add: "+2);
      }
      console.log('updatedNotifications (ADD_NOTIFICATION): ', updatedNotifications);
      return { ...state, notifications: updatedNotifications };
    case "MARK_ALL_READ":
      // Mark all notifications as read if their _id is found in action.payload
      const updatedNotificationsMarkAllRead = state.notifications?.map((n) => {
        // Check if the current notification _id exists in the payload array
        const shouldMarkAsRead = action.payload?.some(
          (payloadItem) => payloadItem._id === n._id
        );
        // Update read status if found in payload
        return shouldMarkAsRead ? { ...n, read: true } : n;
      });
      return { ...state, notifications: updatedNotificationsMarkAllRead };
    case "MARK_READ":
      const updatedNotificationsMarkRead = state.notifications?.map((n) =>
        n._id === action.payload ? { ...n, read: true } : n
      );
      return { ...state, notifications: updatedNotificationsMarkRead };
    default:
      return state;
  }
};
