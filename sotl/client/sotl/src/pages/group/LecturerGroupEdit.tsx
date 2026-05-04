import { useNavigate, useParams } from "react-router-dom";
import ContentPanel from "../../components/ContentPanel";
import { Add, Delete, EditOutlined } from "@mui/icons-material";
import { Box, Button, FormControl, IconButton, Modal, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { groupHooks } from "../../features/student/group/hooks/groupHooks";
import { PopupProps } from "../../components/SuccessPopup";
import { LoadingPopupProps } from "../../components/LoadingPopup";
import { Group, TeamMember } from "src/features/student/group/models";
import ConfirmationPopup from "../../components/ConfirmationPopup";

const LecturerGroupEdit: React.FC = () => {
    const [groupName, setGroupName] = useState<string>('');
    const [groupDescription, setGroupDescription] = useState<string>('');
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [successPopup, setSuccessPopup] = useState(false);
    const [errorPopup, setErrorPopup] = useState(false);
    const [confirmPopup, setConfirmPopup] = useState(false);
    const [isValidSave, setIsValidSave] = useState(false);

    const { getGroup, editGroup, error, loading } = groupHooks();
    const { groupId } = useParams();
    const navigate = useNavigate();

    const errorPopupProps: PopupProps = {
        open: errorPopup,
        content: error!,
        onClose: () => {
            setErrorPopup(false);
            navigate(`/lecturer/group/manage/${groupId}`);
        }
    }

    const successPopupProps: PopupProps = {
        open: successPopup,
        content: 'Group updated successfully',
        onClose: () => {
            setSuccessPopup(false);
            navigate(`/lecturer/group/manage/${groupId}`);
        }
    }

    const loadingPopupProps: LoadingPopupProps = {
        open: loading,
    }

    const onGroupNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setGroupName(event.target.value);
    };

    const onGroupDescriptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setGroupDescription(event.target.value);
    };

    const onRemoveMember = (member: TeamMember) => {
        const newMembers = selectedGroup?.team_members.filter(m => m.student_id !== member.student_id);
        setSelectedGroup({ ...selectedGroup!, team_members: newMembers! });
    };

    const onSave = async () => {
        try {
            const group: Group = {
                name: groupName,
                description: groupDescription,
                team_members: selectedGroup!.team_members
            };
            const response = await editGroup(groupId!, group);
            if (response) {
                setSuccessPopup(true);
            }
        } catch (error) {
            setErrorPopup(true);
        }
    };

    const fetchData = async () => {
        try {
            const group = await getGroup(groupId!);
            if (group) {
                setSelectedGroup(group);
                setGroupName(group.name);
                setGroupDescription(group.description ?? "");
            }
        } catch (error) {
            setErrorPopup(true);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (groupName.length > 0 && groupDescription.length > 0 && selectedGroup!.team_members!.length > 0) {
            setIsValidSave(true);
        } else {
            setIsValidSave(false);
        }
    }, [groupName, groupDescription, selectedGroup]);

    const teamMemberRow = (member: TeamMember, index: number) => {
        return <Box display={"flex"} marginLeft={1} marginBottom={1} justifyContent={'space-between'}>
            <p>
                <span>{index + 1}.</span>
                <span className="ms-12">{member.name}</span>
            </p>
            <IconButton onClick={() => onRemoveMember(member)}><Delete color="error"></Delete></IconButton>
        </Box>
    };

    return <>
        {/* <SearchStudentPopup /> */}
        <ConfirmationPopup
            open={confirmPopup}
            content="Are you sure you want to save your changes?"
            onConfirm={() => {
                setConfirmPopup(false);
                onSave();
            }}
            onClose={() => setConfirmPopup(false)}
        />
        <ContentPanel
            title='Edit Group'
            titleIcon={<EditOutlined />}
            hasBackButton
            backLink={"/lecturer/group/manage/" + groupId}
            errorPopup={errorPopupProps}
            successPopup={successPopupProps}
            loadingPopup={loadingPopupProps}
            content={
                <>
                    {/* Group Name */}
                    <FormControl fullWidth>
                        <TextField
                            label="Group Name"
                            placeholder="Name"
                            variant="outlined"
                            value={groupName}
                            onChange={onGroupNameChange}
                            inputProps={{ maxLength: 100 }}
                            helperText={`${groupName.length}/100`}
                            fullWidth
                        >
                        </TextField>
                        <br />
                    </FormControl>

                    {/* Group Description */}
                    <FormControl fullWidth>
                        <TextField
                            label="Group Description"
                            placeholder="Description"
                            variant="outlined"
                            value={groupDescription}
                            onChange={onGroupDescriptionChange}
                            inputProps={{ maxLength: 200 }}
                            helperText={`${groupDescription.length}/200`}
                            fullWidth
                        >
                        </TextField>
                        <br />
                    </FormControl>

                    {/* Group Members */}
                    <Box display={"flex"} justifyContent={'space-between'} alignItems={"center"}>
                        <p className="text-start">Team Members</p>
                        {/* <IconButton onClick={() => setSearchStudentPopup(true)}><Add></Add></IconButton> */}
                    </Box>
                    <br />
                    {selectedGroup?.team_members.map((member, i) => teamMemberRow(member, i))}
                    <br />

                    {/* Save Button */}
                    <Button variant="contained" color="success" disabled={!isValidSave} onClick={() => setConfirmPopup(true)}>SAVE</Button>
                </>
            }
        />
    </>;
}

export default LecturerGroupEdit;