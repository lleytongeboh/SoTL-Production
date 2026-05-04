import React from 'react';
import Navbar from '../components/Navbar/Navbar';
import { Link, Outlet } from 'react-router-dom';
import { Box, Drawer, List, ListItem, ListItemText, Collapse } from '@mui/material';
import { styled } from '@mui/material/styles';
import { AssessmentOutlined, AssignmentOutlined, KeyboardArrowDown, KeyboardArrowUp, PeopleAltOutlined, PersonOutlined, WorkspacePremium } from '@mui/icons-material';
import { useLocation } from 'react-router-dom';

const PATHS: {[key: string]: string} = {
    ASSESSMENT_RESULT_MANAGE: 'assessment-result/list'
}

const AdminLayout: React.FC = () => {
    const [userManagementOpen, setUserManagementOpen] = React.useState(false);
    const [projectManagementOpen, setProjectManagementOpen] = React.useState(false);
    const [accessmentManagementOpen, setAccessmentManagementOpen] = React.useState(false);
    const location = useLocation();
    const isReviewPage = location.pathname.startsWith('/lecturer/assessment-result/') && location.pathname.includes('/review');

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

    const collapsibleListItem = (title: string, icon: React.ReactNode, open: boolean, onClick?: Function, linkPath?: string): React.ReactNode => {
        return (
            <ListItem button component={linkPath ? Link : 'button'} to={linkPath} className='gap-5 mt-3' onClick={() => { onClick && onClick() }}>
                {icon}
                <ListItemText primary={title} />
                {!open ? <KeyboardArrowDown /> : <KeyboardArrowUp />}
            </ListItem>
        );
    }

    return (
        <div>
            <Navbar />
            <Box sx={{ display: 'flex', marginTop: '64px', backgroundColor: '#F6F6F6' }}>
                {!isReviewPage && <Sidebar variant="permanent">
                    <List>
                        {/* User Management */}
                        <>
                            {collapsibleListItem('User Management', <PersonOutlined />, userManagementOpen, () => setUserManagementOpen(!userManagementOpen))}
                            <Collapse in={userManagementOpen}>
                                <List>
                                    <ListItem button component={Link} to="user-management/batch">
                                        <ListItemText primary="Student" sx={{ paddingInlineStart: '50px' }} />
                                    </ListItem>
                                    <ListItem button component={Link} to="user-management/client">
                                        <ListItemText primary="Client" sx={{ paddingInlineStart: '50px' }} />
                                    </ListItem>
                                </List>
                            </Collapse>
                        </>

                        {/* Group Management */}
                        <ListItem button className='gap-5' component={Link} to="group/list">
                            <PeopleAltOutlined />
                            <ListItemText primary="Group Management" />
                        </ListItem>

                        {/* Project Management */}
                        <>
                            {collapsibleListItem('Project Management', <AssessmentOutlined />, projectManagementOpen, () => setProjectManagementOpen(!projectManagementOpen))}
                            <Collapse in={projectManagementOpen}>
                                <List>
                                    <ListItem button component={Link} to="project-deliverables">
                                        <ListItemText primary="Project Deliverables" sx={{ paddingInlineStart: '50px' }} />
                                    </ListItem>
                                    <ListItem button component={Link} to="project-marking/list">
                                        <ListItemText primary="Project Marking" sx={{ paddingInlineStart: '50px' }} />
                                    </ListItem>
                                </List>
                            </Collapse>
                        </>

                        {/* Assessment Management */}
                        <>
                            {collapsibleListItem('Assessment Management', <AssessmentOutlined />, accessmentManagementOpen, () => setAccessmentManagementOpen(!accessmentManagementOpen))}
                            <Collapse in={accessmentManagementOpen}>
                                <List>
                                    <ListItem button component={Link} to="quiz/list">
                                        <ListItemText primary="Quiz" sx={{ paddingInlineStart: '50px' }} />
                                    </ListItem>
                                    <ListItem button component={Link} to="assessment/list" >
                                        <ListItemText primary="Assessment" sx={{ paddingInlineStart: '50px' }} />
                                    </ListItem>
                                    <ListItem button component={Link} to={PATHS.ASSESSMENT_RESULT_MANAGE}>
                                        <ListItemText primary="Assessment Result" sx={{ paddingInlineStart: '50px' }} />
                                    </ListItem>
                                </List>
                            </Collapse>
                        </>

                        {/* Badge Management */}
                        <ListItem button className='gap-5' component={Link} to="badge-management">
                            <WorkspacePremium />
                            <ListItemText primary="Badge Management" />
                        </ListItem>
                    </List>
                </Sidebar>}

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
                    <Outlet />
                </Box>
            </Box>
        </div>
    );
};

export default AdminLayout;
export { PATHS }
