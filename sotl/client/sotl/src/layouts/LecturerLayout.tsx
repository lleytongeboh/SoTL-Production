import React from 'react';
import Navbar from '../components/Navbar/Navbar';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Box, Drawer, List, ListItem, ListItemText } from '@mui/material';
import { styled } from '@mui/material/styles';

const LecturerLayout: React.FC = () => {
  const location = useLocation();

  const isProjectPage = location.pathname.startsWith('/project');


  const Sidebar = styled(Drawer)(({ theme }) => ({
    '& .MuiDrawer-paper': {
      width: 240,
      // backgroundColor: theme.palette.primary.main,
      color: 'white',
      fontWeight: 'bold',
      boxSizing: 'border-box',
      marginTop: '64px', // To avoid overlap with the fixed navbar
      // mode: 'dark',
      borderRight: '1px solid #ddd',
    },
  }));

  return (
    <div>
      <Navbar />
      <Box sx={{ display: 'flex', marginTop: '64px' }}>
        {/* Sidebar for Project Page */}
        {!isProjectPage && (
          <Sidebar variant="temporary">
            <List>
              <ListItem component={Link} to="evaluation/manageall">
                <ListItemText primary="User Management" />
              </ListItem>
              <ListItem component={Link} to="project/todos">
                <ListItemText primary="Group Management" />
              </ListItem>
              <ListItem component={Link} to="project/forum">
                <ListItemText primary="Project Management" />
              </ListItem>
              <ListItem component={Link} to="evaluation/manageall">
                <ListItemText primary="Assessment Management" />
              </ListItem>
            </List>
          </Sidebar>
        )}

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            ml: isProjectPage ? '240px' : '0', // Offset content by sidebar width
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </div>
  );
};

export default LecturerLayout;
