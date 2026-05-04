import React, { useEffect } from 'react';
import Navbar from '../components/Navbar/Navbar';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Box, Drawer, List, ListItem, ListItemText, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Group } from '../features/student/group/models';
import { useGroup } from '../features/student/group/context/GroupContext';
import { groupHooks } from '../features/student/group/hooks/groupHooks';
import ErrorComponent from '../components/ErrorComponent';
import { useProject } from '../features/student/project/context/ProjectContext';
import { Project } from '../features/student/project/models';
import { projectHooks } from '../features/student/project/hooks/projectHooks';

const ClientLayout: React.FC = () => {
  const location = useLocation();

  const Sidebar = styled(Drawer)(({ theme }) => ({
    width: 240,
    flexShrink: 0,
    '& .MuiDrawer-paper': {
      width: 240,
      backgroundColor: theme.palette.primary.main,
      color: 'white',
      fontWeight: 'bold',
      boxSizing: 'border-box',
      marginTop: '64px', // To avoid overlap with the fixed navbar
      borderRight: '1px solid #ddd',
    },
  }));

  useEffect(() => {
    
  }, []);

  return (
    <>
      <Navbar publicMode />
      <Box sx={{ display: 'flex', marginTop: '64px' }}>
        {/* Sidebar for Project Page */}


        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            px: '20px',
            py: '50px',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </>
  );
};

export default ClientLayout;
