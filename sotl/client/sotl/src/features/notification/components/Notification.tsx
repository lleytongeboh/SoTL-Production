// components/Notification.tsx
import React, { useState, useEffect, Dispatch } from 'react';
import { Box, Badge, IconButton, Menu, MenuItem } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useFetchNotification } from '../hooks';
import { NotificationState, Action, NotificationData } from '../models';
import { markNotificationAsRead, markAllNotificationsAsRead } from '../services';
import CloseIcon from '@mui/icons-material/Close'; // Import the Close icon
import DoneAllIcon from '@mui/icons-material/DoneAll'; // Import the icon for marking as read
import InfoIcon from '@mui/icons-material/Info';
import moment from 'moment';

interface NotificationProps {
  style: object;
}

const Notification: React.FC<NotificationProps> = ({ style }) => {
  const [{ notifications, loading, error }, notificationDispatch]: [NotificationState, Dispatch<Action>] = useFetchNotification() as [NotificationState, Dispatch<Action>];
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkClicked = async (notificationId: string) => {
    try {
      // Send request to backend to mark as read using the service layer
      await markNotificationAsRead(notificationId);
      // Dispatch action to update the notification state
      notificationDispatch({ type: 'MARK_READ', payload: notificationId });
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      // Mark all notifications as read using the service layer
      const response = await markAllNotificationsAsRead(notifications);
      // Dispatch action to update all notifications' state
      if (response.result !== undefined && response.result !== null) {
        notificationDispatch({ type: 'MARK_ALL_READ', payload: response.result });
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read', error);
    }
  };

  const getSymbolColor = (type: string) => {
    if (type === 'info') {
      return 'info';
    } else if (type === 'warning') {
      return 'warning';
    } else if (type === 'alert') {
      return 'error';
    }
    return 'info';
  }

  const ITEM_HEIGHT = 48;

  // Memoize the unread count calculation
  const unreadCount = notifications?.filter(notification => !notification.read).length;

  const noChecked = () => {
    if (loading === false && unreadCount != undefined && unreadCount > 0) {
      return false;
    }
    return true;
  }

  const readTextTime = (notification: NotificationData) => {
    if (notification.read === true) {
      return moment(notification.updatedAt).fromNow();
    }
    return moment(notification.createdAt).fromNow();
  }

  return (
    <Box sx={style}>
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={unreadCount} color="secondary">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        id="long-menu"
        MenuListProps={{ 'aria-labelledby': 'long-button' }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            style: {
              maxHeight: ITEM_HEIGHT * 4.5,
              width: '24ch',
            },
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'right', p: 1 }}>
          <IconButton onClick={handleMarkAllRead} size="small" color="success" aria-label="mark as read" disabled={noChecked()}>
            <DoneAllIcon />
          </IconButton>
          <IconButton onClick={handleClose} size="small" color="inherit" aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>
        {loading && <MenuItem disabled>Loading...</MenuItem>}
        {error && <MenuItem disabled>Error: {error}</MenuItem>}
        {notifications?.map((notification, index) => {
          return (
            <MenuItem key={notification._id} onClick={() => handleMarkClicked(notification._id)} sx={{ fontSize: 12, textWrap: 'wrap', borderBottom: index === notifications.length - 1 ? undefined : 1, borderColor: 'rgba(128, 128, 128, 0.5)', padding: 0, paddingX: 1, paddingTop: 1 }}>
              <Badge color="error" variant="dot"
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }} invisible={notification.read}
                className="w-full"
              >
                <Box className="w-full">
                  <Box sx={{ fontWeight: 'normal', textWrap: 'wrap', fontSize: 12 }} className="gap-1 flex flex-row items-start">
                    <Box><InfoIcon color={getSymbolColor(notification.type)} fontSize='inherit'/></Box>
                    {notification.message}
                  </Box>
                  <Box sx={{ fontWeight: 'lighter', fontSize: 10 }} className="flex flex-row justify-end items-center gap-2">
                    {readTextTime(notification)}
                    <p className={notification.read === true ? 'text-green-500' : 'text-neutral-400'}>✔✔</p>
                  </Box>
                </Box>
              </Badge>
            </MenuItem>
          )
        })}
      </Menu>
    </Box>
  );
};

export default Notification;