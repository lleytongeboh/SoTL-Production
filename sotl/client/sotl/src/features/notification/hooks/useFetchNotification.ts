// hooks/useFetchNotifications.ts
import { useEffect, useReducer } from "react";
import { notificationReducer } from "./NotificationReducer";
import { initialState } from "../models";
import { API_BASE_URL } from "../../../configs/sotl-config";
import { standardApi } from '../../../utils/standardApi'; // Adjust the import path as necessary
import { Notifications } from '../models';

export const useFetchNotification = () => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  useEffect(() => {
    const fetchData = async () => {
      dispatch({ type: "FETCH_INIT" });
      try {
        const response = await standardApi(`${API_BASE_URL}/api/notifications`, 'GET', true);
        console.log('response Notification', response);
        dispatch({ type: "FETCH_SUCCESS", payload: response.result as Notifications });
      } catch (err) {
        dispatch({ type: "FETCH_FAILURE", payload: (err as Error).message });
      }
    };

    fetchData();
  }, []);

  return [state, dispatch];
};
