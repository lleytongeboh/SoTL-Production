import { Avatar, Box, Button, Collapse, IconButton, List, ListItemAvatar, ListItemButton, ListItemText } from "@mui/material";
import ContentPanel from "../../components/ContentPanel";
import { Group, TeamMember } from "../../features/student/group/models";
import { useGroup } from "../../features/student/group/context/GroupContext";
import { useState } from "react";
import { EditOutlined, ExpandLess, ExpandMore } from "@mui/icons-material";
import { Link, useNavigate } from "react-router-dom";
import { groupHooks } from "../../features/student/group/hooks/groupHooks";
import { PopupProps } from "../../components/SuccessPopup";
import { LoadingPopupProps } from "../../components/LoadingPopup";
import ConfirmationPopup from "../../components/ConfirmationPopup";
import { Project } from "../../features/student/project/models";
import { useProject } from "../../features/student/project/context/ProjectContext";

const GroupManage: React.FC = () => {
    const { selectedGroup, setSelectedGroup }: { selectedGroup: Group, setSelectedGroup : React.Dispatch<React.SetStateAction<Group | null>> } = useGroup();
    const { setSelectedProject }: { setSelectedProject : React.Dispatch<React.SetStateAction<Project | null>> } = useProject();
    const { leaveGroup, error, loading } = groupHooks();
    const navigate = useNavigate();

    const [successPopup, setSuccessPopup] = useState(false);
    const [errorPopup, setErrorPopup] = useState(false);
    const [confirmPopup, setConfirmPopup] = useState(false);

    const errorPopupProps: PopupProps = {
        open: errorPopup,
        content: error || 'An error occurred',  
        onClose: () => {
            setErrorPopup(false);
            navigate(`/student/*`);
        }
    }

    const successPopupProps: PopupProps = {
        open: successPopup,
        content: 'Group updated successfully',
        onClose: () => {
            setSuccessPopup(false);
            navigate(`/student/*`);
            setSelectedGroup(null);
            setSelectedProject(null);
        }
    }

    const loadingPopupProps: LoadingPopupProps = {
        open: loading,
    }

    const handleLeaveGroup = async () => {
        try {
            const response = await leaveGroup(selectedGroup._id!);
            if (response) {
                setSuccessPopup(true);
            }
        } catch (error) {
            setErrorPopup(true);
        }
    };

    function GroupMemberRow(props: { member: TeamMember }) {
        const { member } = props;
        const [expand, setExpand] = useState(false);
        return (
            <>
                <ListItemButton onClick={() => setExpand(!expand)}>
                    <ListItemAvatar>
                        <Avatar>
                        </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={`${member.name} ${member.group_role === 'Leader' ? "*" : ""}`} />
                    {expand ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                <Collapse in={expand} timeout='auto' unmountOnExit>
                    <Box sx={{ marginX: 5, marginY: 3 }}>
                        <div className="flex justify-between">
                            <p>Email: {member.email}</p>
                            <p>Matric: {member.matric}</p>
                        </div>
                        <p>Role: {member.group_role}</p>
                    </Box>
                </Collapse>
            </>
        );
    }

    return (
        <>
            <ConfirmationPopup
                open={confirmPopup}
                content="Are you sure you want to leave the group?"
                onConfirm={() => {
                    setConfirmPopup(false);
                    handleLeaveGroup();
                }}
                onClose={() => setConfirmPopup(false)}
            />
            <ContentPanel
                title={`${selectedGroup.name} - [Batch: ${selectedGroup.batch}]`}
                customActions={<IconButton component={Link} to={"/student/group/edit"}><EditOutlined /></IconButton>}
                errorPopup={errorPopupProps}
                successPopup={successPopupProps}
                loadingPopup={loadingPopupProps}
                content={
                    <div className="text-start">
                        <p className="mb-7">{selectedGroup.description}</p>
                        <p className="title">Group Members</p>
                        <List>
                            {/* {members.map((member) => <GroupMemberRow key={member.student_id} member={member} />)} */}
                            {selectedGroup.team_members.map((member) => <GroupMemberRow key={member.student_id} member={member} />)}
                        </List>
                        <br />
                        <div className="text-center">
                            <Button variant="outlined" color="warning" onClick={() => setConfirmPopup(true)}>LEAVE</Button>
                        </div>
                    </div>
                }
            />
        </>
    );
};

export default GroupManage;