import { useNavigate } from "react-router-dom";
import ContentPanel from "../../components/ContentPanel";
import { Delete, EditOutlined } from "@mui/icons-material";
import { Box, Button, FormControl, IconButton, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { groupHooks } from "../../features/student/group/hooks/groupHooks";
import { PopupProps } from "../../components/SuccessPopup";
import { LoadingPopupProps } from "../../components/LoadingPopup";
import { Group, TeamMember } from "src/features/student/group/models";
import ConfirmationPopup from "../../components/ConfirmationPopup";
import { useGroup } from "../../features/student/group/context/GroupContext";
import React from "react";
import { StudentProps, useAuth } from "../../features/auth/context/AuthContext";

const GroupEdit: React.FC = () => {
    const { checkGroup, editGroup, error, loading } = groupHooks();
    const { selectedGroup, setSelectedGroup }: { selectedGroup: Group, setSelectedGroup: React.Dispatch<React.SetStateAction<Group | null>> } = useGroup();
    const { identity } = useAuth();
    const profile: StudentProps = identity as StudentProps;
    const navigate = useNavigate();

    const [groupName, setGroupName] = useState<string>(selectedGroup!.name ?? "");
    const [groupDescription, setGroupDescription] = useState<string>(selectedGroup!.description ?? "");
    const [successPopup, setSuccessPopup] = useState(false);
    const [errorPopup, setErrorPopup] = useState(false);
    const [confirmPopup, setConfirmPopup] = useState(false);
    const [isValidSave, setIsValidSave] = useState(false);
    const [newMembers, setNewMembers] = useState<TeamMember[]>(selectedGroup!.team_members);

    const errorPopupProps: PopupProps = {
        open: errorPopup,
        content: error!,
        onClose: () => {
            setErrorPopup(false);
            navigate(`/student/group/manage`);
        }
    }

    const successPopupProps: PopupProps = {
        open: successPopup,
        content: 'Group updated successfully',
        onClose: () => {
            setSuccessPopup(false);
            navigate(`/student/group/manage`);
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
        const members = newMembers.filter(m => m.student_id !== member.student_id);
        setNewMembers(members);
    };

    const onSave = async () => {
        try {
            const group: Group = {
                name: groupName,
                description: groupDescription,
                team_members: newMembers
            };
            const response = await editGroup(selectedGroup._id!, group);
            if (response) {
                setSelectedGroup(await checkGroup(profile.loginAsBatch));
                setSuccessPopup(true);
            }
        } catch (error) {
            setErrorPopup(true);
        }
    };

    useEffect(() => {
        if (groupName.length > 0 && groupDescription.length > 0 && newMembers.length > 0) {
            setIsValidSave(true);
        } else {
            setIsValidSave(false);
        }
    }, [groupName, groupDescription, newMembers]);

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
            backLink={"/student/group/manage"}
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
                    {<>
                        <Box display={"flex"} justifyContent={'space-between'} alignItems={"center"}>
                            <p className="text-start">Team Members</p>
                            {/* <IconButton onClick={() => setSearchStudentPopup(true)}><Add></Add></IconButton> */}
                        </Box>
                        <br />
                        {newMembers.map((member, i) => <React.Fragment key={i}>{teamMemberRow(member, i)}</React.Fragment>)}
                        <br />

                        {/* Save Button */}
                        <Button variant="contained" color="success" disabled={!isValidSave} onClick={() => setConfirmPopup(true)}>SAVE</Button>
                    </>}
                </>
            }
        />
    </>;
}

export default GroupEdit;