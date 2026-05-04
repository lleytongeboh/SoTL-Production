export interface NotificationData {
  _id: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type Notifications = NotificationData[] | undefined;

export type NotificationState = {
  notifications: Notifications;
  loading: boolean;
  error: string | null;
};

export type NotificationResponse = {
  result?: NotificationData[];
  message: string;
  error?: string | null;
};

export type Action =
  | { type: "FETCH_INIT" }
  | { type: "FETCH_SUCCESS"; payload: Notifications }
  | { type: "FETCH_FAILURE"; payload: string }
  | { type: "ADD_NOTIFICATION"; payload: NotificationData }
  | { type: "MARK_ALL_READ"; payload: Notifications }
  | { type: "MARK_READ"; payload: string };

export const initialState: NotificationState = {
  notifications: [],
  loading: false,
  error: null,
};
