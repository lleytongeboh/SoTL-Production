import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Link } from 'react-router-dom';
import { Notification } from '../../features/notification';
import AvatarMenu from './AvatarMenu';
import { useAuth } from '../../features/auth/context';


interface NavBarProps {
  publicMode?: boolean;
}

const Navbar: React.FC<NavBarProps> = ({ publicMode = false }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { role } = useAuth();
  const showStudentGuide = import.meta.env.VITE_ENABLE_STUDENT_GUIDE !== 'false';

  const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
    if (
      event.type === 'keydown' &&
      ((event as React.KeyboardEvent).key === 'Tab' || (event as React.KeyboardEvent).key === 'Shift')
    ) {
      return;
    }
    setIsDrawerOpen(open);
  };

  const menuItems = (
    <Box
      sx={{ width: 250 }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <List>
        <ListItem component={Link} to={`${role}/project/details`}>
          <ListItemText primary="Project" />
        </ListItem>
        {
          role === 'student' && (
            <ListItem component={Link} to={`assessment/list`}>
              <ListItemText primary="Quiz" />
            </ListItem>
          )
        }

        <ListItem component={Link} to={`leaderboard`}>
          <ListItemText primary="Leaderboard" />
        </ListItem>
        {
          role === 'student' && showStudentGuide && (
            <ListItem component={Link} to="/student/guide">
              <ListItemText primary="Guide" />
            </ListItem>
          )
        }
      </List>
    </Box>
  );

  return (
    <AppBar position="fixed" sx={{ backgroundColor: 'white', color: 'black', boxShadow: 1 }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Logo Section (Hidden on small screens) */}
        <Box
          sx={{ display: publicMode ? { md: 'block' } : { xs: 'none', md: 'block' }}}
        >
          <img src="/images/logo.jpg" alt="Logo" style={{height: '40px', width:'40px'}}></img>
        </Box>

        {/* Menu Icon (Visible on small screens) */}
        {!publicMode && <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          sx={{ display: { xs: 'block', md: 'none' } }}
          onClick={toggleDrawer(true)}
        >
          <MenuIcon />
        </IconButton>}

        {/* Navigation Links (Hidden on small screens) */}
        {!publicMode && <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
          <Link to={`${role}/project/details`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <Typography variant="button">Project</Typography>
          </Link>
          {
            role === 'student' && (
              <Link to={`assessment/list`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <Typography variant="button">Quiz</Typography>
              </Link>
            )
          }
          <Link to={`leaderboard`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <Typography variant="button">Leaderboard</Typography>
          </Link>
          {
            role === 'student' && showStudentGuide && (
              <Link to="/student/guide" style={{ textDecoration: 'none', color: 'inherit' }}>
                <Typography variant="button">Guide</Typography>
              </Link>
            )
          }
        </Box>}

        {/* Notification Icon and Avatar */}
        {!publicMode && <Box style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Notification style={{ marginRight: '1rem' }} />
          <AvatarMenu />
        </Box>}
      </Toolbar>

      {/* Drawer for Small Screens */}
      <Drawer anchor="left" open={isDrawerOpen} onClose={toggleDrawer(false)}>
        {menuItems}
      </Drawer>
    </AppBar>
  );
};

export default Navbar;
