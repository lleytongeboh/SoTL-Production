import React, { useEffect } from 'react';
import Navbar from '../components/Navbar/Navbar';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Box, Drawer, List, ListItem, ListItemText, Divider, Button, Tooltip, Modal, Select, MenuItem, FormControl, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Group } from '../features/student/group/models';
import { useGroup } from '../features/student/group/context/GroupContext';
import { groupHooks } from '../features/student/group/hooks/groupHooks';
import { useProject } from '../features/student/project/context/ProjectContext';
import { Project } from '../features/student/project/models';
import { projectHooks } from '../features/student/project/hooks/projectHooks';
import { PeopleAltOutlined } from '@mui/icons-material';
import { useAuth } from '../features/auth/context';
import { StudentProps } from '../features/auth/context/AuthContext';
import { useProfileHooks } from '../features/profile/hooks/useProfileHooks';

const StudentLayout: React.FC = () => {
  const { selectedGroup, setSelectedGroup }: { selectedGroup: Group, setSelectedGroup: React.Dispatch<React.SetStateAction<Group | null>> } = useGroup();
  const { selectedProject, setSelectedProject }: { selectedProject: Project, setSelectedProject: React.Dispatch<React.SetStateAction<Project | null>> } = useProject();
  const { checkGroup, error } = groupHooks();
  const { checkProject, error: pError } = projectHooks();
  const { changeLoginAsBatch, hookError: profileError } = useProfileHooks();
  const { identity, setIdentity } = useAuth();
  const profile: StudentProps = identity as StudentProps;
  const location = useLocation();
  const navigate = useNavigate();
  const isProjectPage = location.pathname.startsWith('/student/project') || location.pathname.startsWith('/student/group');
  const isAssessmentListPage = location.pathname.startsWith('/student/assessment/list');

  const [changeBatchPopup, setChangeBatchPopup] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [selectedBatch, setSelectedBatch] = React.useState<string>(profile.loginAsBatch);

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

  function ChangeBatchPopup(): React.ReactNode {
    const style = {
      position: 'absolute' as 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 400,
      bgcolor: 'background.paper',
      border: '2px solid #000',
      boxShadow: 24,
      p: 4,
    };

    return (
      <Modal
        open={changeBatchPopup}
        onClose={() => setChangeBatchPopup(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Box display={'flex'} gap={2} alignItems={'center'}>
            <PeopleAltOutlined fontSize='large' />
            <Typography id="modal-modal-title" variant="h6" component="h2" className="text-center">
              Select Batch
            </Typography>
          </Box>
          <br />
          <FormControl fullWidth>
            <Select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value as string)}
            >
              {profile.batch.map((batch, index) => (
                <MenuItem key={index} value={batch.batch}>{batch.batch}</MenuItem>
              ))}
            </Select>
            <br />
          </FormControl>
          <Box display={'flex'} justifyContent={'space-around'}>
            <Button variant="contained" color='error' onClick={() => setChangeBatchPopup(false)}>CANCEL</Button>
            <Button variant="contained" color='success' onClick={() => {
              handleChangeBatch(selectedBatch);
              setChangeBatchPopup(false);
            }}>CHANGE</Button>
          </Box>
        </Box>
      </Modal>
    );
  }

  const getGroupAndProject = async () => {
    try {
      const group: Group | null = await checkGroup(selectedBatch);
      if (group) {
        setSelectedGroup(group);
        const project: Project | null = await checkProject(group._id!);
        setSelectedProject(project);
      } else {
        setSelectedGroup(null);
        setSelectedProject(null);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeBatch = async (batch: string) => {
    try {
      await changeLoginAsBatch(batch);
      await getGroupAndProject();
      setIdentity({ ...profile, loginAsBatch: batch });
      navigate('/student/project/details');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    getGroupAndProject();
  }, []);

  return (
    <>
      <ChangeBatchPopup />
      <Navbar />
      <Box sx={{ display: 'flex', marginTop: '64px' }}>
        {/* Sidebar for Project Page */}
        {(isProjectPage || isAssessmentListPage) && (
          <Sidebar variant="permanent">
            {
              <Box
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  marginX: '10px',
                  marginY: '20px',
                  alignContent: 'center',
                  borderRadius: '8px',
                  padding: '10px',
                  minHeight: '80px',
                }}
              >
                {(error || pError || profileError) ?
                  error ?? pError ?? profileError ?? "Error" :
                  <>
                    <Tooltip title="View Group"><Button component={Link} to={selectedGroup && '/student/group/manage'} variant='text'><p style={{ color: "white" }}>{(selectedGroup as Group)?.name ?? "No Group"}</p></Button></Tooltip>
                    <Divider sx={{ backgroundColor: 'white', marginX: '10px', marginY: '5px' }}></Divider>
                    <Tooltip title="Change Batch"><Button variant='text' onClick={() => setChangeBatchPopup(true)}><p style={{ color: "white" }}>{profile.loginAsBatch}</p></Button></Tooltip>
                  </>}
              </Box>
            }
            <Divider sx={{ backgroundColor: 'white', marginX: '10px' }}></Divider>
            <List>
              <ListItem button component={Link} to="/student/project/details">
                <ListItemText primary="Project Details" />
              </ListItem>
              <ListItem button component={Link} to="/student/project/todos" disabled={selectedProject == null}>
                <ListItemText primary="To-dos" />
              </ListItem>
              <ListItem button component={Link} to="/student/project/submission" disabled={selectedProject == null}>
                <ListItemText primary="Submission" />
              </ListItem>
            </List>
          </Sidebar>
        )}

        {/* Main Content */}
        <Box
          component="main"

          sx={{
            flexGrow: 1,
            px: '20px',
            py: '50px',
            width: 'calc(100% - 240px)',
          }}
        >
          {loading ? <div>Loading...</div> : <Outlet />}
        </Box>
      </Box>
    </>
  );
};

export default StudentLayout;
