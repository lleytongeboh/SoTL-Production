import React from 'react';
import {
    Avatar,
    IconButton,
    Menu,
    MenuItem
} from '@mui/material';
import { useAuth } from '../../features/auth/context';
import ConfirmationPopup from '../ConfirmationPopup';
import { useNavigate } from 'react-router-dom';

const AvatarMenu = () => {
    const { logout, role } = useAuth();
    const navigate = useNavigate();
    const [openLogout, setOpenLogout] = React.useState(false);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };
    const handleProfileClick = () => {
        navigate(`/${role}/profile`);
    }

    const handleChangePassword = () => {
        navigate('/login/change-password');
    };

    const handleLogout = () => {
      sessionStorage.removeItem('token');
      localStorage.removeItem('token');
      sessionStorage.removeItem('__chatbox_refreshed__');

      window.location.href = '/login'; // FULL refresh
    };

    return (
        <>
            <IconButton onClick={handleClick}>
                <Avatar>H</Avatar>
            </IconButton>
            <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'basic-button',
                }}
            >
                <MenuItem onClick={handleProfileClick}>Profile</MenuItem>
                <MenuItem onClick={handleChangePassword}>Reset Password</MenuItem>
                <MenuItem onClick={()=> setOpenLogout(true)}>Logout</MenuItem>
            </Menu>
            <ConfirmationPopup open={openLogout} onConfirm={handleLogout} onClose={()=> setOpenLogout(false)} content="Are you sure you want to logout?" />
        </>
    )
}

export default AvatarMenu;