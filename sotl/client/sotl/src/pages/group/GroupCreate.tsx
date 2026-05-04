import { AddBoxOutlined, Clear } from "@mui/icons-material";
import ContentPanel from "../../components/ContentPanel";
import { Box, Button, Checkbox, Chip, FormControl, FormHelperText, IconButton, InputLabel, ListItemText, MenuItem, Select, SelectChangeEvent, TextField } from "@mui/material";
import React, { useEffect, useState } from "react";
import SuccessPopup from "../../components/SuccessPopup";
import { useNavigate } from "react-router-dom";
import { Group } from "../../features/student/group/models";
import { groupHooks } from "../../features/student/group/hooks/groupHooks";
import ErrorPopup from "../../components/ErrorPopup";
import { useGroup } from "../../features/student/group/context/GroupContext";
import { PROJECT_ROLES } from "../../utils/constants";
import { useAuth } from "../../features/auth/context";
import { StudentProps } from "../../features/auth/context/AuthContext";


const GroupCreate: React.FC = () => {
    const { identity } = useAuth();
    const profile = identity as StudentProps;
    const { setSelectedGroup } = useGroup();
    const { createGroup, error } = groupHooks();
    const [groupName, setGroupName] = useState<string>('');
    const [groupDescription, setGroupDescription] = useState<string>('');
    const [successPopup, setSuccessPopup] = useState(false);
    const [errorPopup, setErrorPopup] = useState(false);
    const [validCreate, setValidCreate] = useState(false);
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

    const projectRoles = PROJECT_ROLES;
    const navigate = useNavigate();

    const validateCreate = () => {
        if (groupName.length > 0 && groupDescription.length > 0 && selectedRoles.length > 0) {
            setValidCreate(true);
        } else {
            setValidCreate(false);
        }
    }

    const onGroupNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setGroupName(event.target.value);
    };

    const onGroupDescriptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setGroupDescription(event.target.value);
    };

    const onRolesChange = (event: SelectChangeEvent<string[]>) => {
        setSelectedRoles(event.target.value as string[]);
    };

    const onCreateGroup = async () => {
        try {
            const group: Group = {
                name: groupName,
                description: groupDescription,
                team_members: [],
                batch: profile.loginAsBatch
            };
            const response: Group = await createGroup(group, selectedRoles);
            if (response) {
                setSelectedGroup(response);
                setSuccessPopup(true);
            }
        } catch (error) {
            setErrorPopup(true);
        }
    };

    useEffect(() => {
        validateCreate();
    }, [groupName, groupDescription, selectedRoles]);

    return (
        <>
            <SuccessPopup
                open={successPopup}
                content="Group Created Successfully"
                onClose={() => {
                    setSuccessPopup(false);
                    navigate('/student/project/details');
                }}
            />
            <ErrorPopup
                open={errorPopup}
                content={error!}
                onClose={() => {
                    setErrorPopup(false);
                    navigate('/student/project/details');
                }}
            />
            <ContentPanel
                title='Create Group'
                hasBackButton={true}
                backLink='/student/project/details'
                titleIcon={<AddBoxOutlined fontSize="large" />}
                content={
                    error ?
                        <Box>
                            <p>{error}</p>
                        </Box> :
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

                            {/* Project Roles */}
                            <FormControl fullWidth>
                                <InputLabel id='role-select-label'>Select Role</InputLabel>
                                <Select
                                    multiple
                                    labelId="role-select-label"
                                    label="Select Role"
                                    value={selectedRoles}
                                    onChange={onRolesChange}
                                    endAdornment={
                                        <>
                                            <IconButton
                                                sx={{ marginInlineEnd: '25px' }}
                                                onClick={() => setSelectedRoles([])}
                                            ><Clear></Clear></IconButton>
                                        </>
                                    }
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {selected.map((value, index) => (
                                                <Chip
                                                    key={index}
                                                    label={value}
                                                    onDelete={(event) => {
                                                        event.stopPropagation();
                                                        setSelectedRoles(selectedRoles.filter(e => e !== value));
                                                    }}
                                                    onMouseDown={(event) => {
                                                        event.stopPropagation();
                                                    }}
                                                />
                                            ))}
                                        </Box>
                                    )}
                                >
                                    {projectRoles.map((role) => (
                                        <MenuItem
                                            key={role}
                                            value={role}
                                        >
                                            <Checkbox checked={selectedRoles.includes(role)} />
                                            <ListItemText primary={role}></ListItemText>
                                        </MenuItem>
                                    ))}
                                </Select>
                                <FormHelperText>** Please pick at least 1 role</FormHelperText>
                                <br />
                            </FormControl>
                            <Button variant="contained" disabled={!validCreate} color="success" onClick={onCreateGroup}>CREATE</Button>
                        </>
                }
            >
            </ContentPanel>
        </>
    );
}

export default GroupCreate;