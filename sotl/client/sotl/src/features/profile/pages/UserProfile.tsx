import ContentPanel from "../../../components/ContentPanel";
import { useProfileHooks } from '../hooks/useProfileHooks';
import { useEffect, useState } from 'react';
import PersonIcon from '@mui/icons-material/Person';
import IconButton from '@mui/material/IconButton';
import { Edit, Done, Clear } from '@mui/icons-material';
import EditableTextField from "../../../components/EditableTextField";
import { EditStudentProfileRequest, EditLecturerProfileRequest } from '../models';
import SelectionBox from '../../../components/SelectionBox';
import { useAuth, StudentProps, LecturerProps } from "../../auth/context/AuthContext";
import { Typography } from "@mui/material";
import { validateEmail } from "../../../utils/validator";
import { LoadingPopupProps } from "../../../components/LoadingPopup";
import { PopupProps } from "../../../components/SuccessPopup";
import moment from 'moment';

const UserProfile: React.FC = () => {
    const { identity, setIdentity, role } = useAuth();
    const { updateStudentProfile, updateLecturerProfile, hookLoading } = useProfileHooks();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<{ status: boolean, message: string }>({ status: false, message: '' });
    const [isEdit, setIsEdit] = useState<boolean>(false);
    const [canSave, setCanSave] = useState<boolean>(false);
    const [batchSelected, setBatchSelected] = useState<string>('');
    const [originalUserData, setOriginalUserData] = useState<StudentProps | LecturerProps | null>(null);
    const [UserData, setUserData] = useState<StudentProps | LecturerProps | null>(null);
    const [success, setSuccess] = useState<boolean>(false);

    const loadingPopupProps: LoadingPopupProps = {
        open: isLoading || hookLoading
    };

    const successPopupProps: PopupProps = {
        open: success,
        content: 'Profile updated successfully',
        onClose: () => setSuccess(false)
    };

    const errorPopupProps: PopupProps = {
        open: error.status,
        content: error.message,
        onClose: () => setError({ status: false, message: ''})
    };

    // Handle Can Save: Check if the clientData is different from the originalClientData
    useEffect(() => {
        checkCanSave();
    }, [UserData]);

    const checkCanSave = () => {
        if (UserData === null || originalUserData === null) {
            setCanSave(false);
            return;
        }

        if (role === 'student' && 'matric' in UserData && 'matric' in originalUserData) {
            if (checkHasNotChange('name') && checkHasNotChange('matric') && checkHasNotChange('email')) {
                setCanSave(false);
                return;
            }
            if (checkNotEmpty('name') && checkNotEmpty('matric') && checkNotEmpty('email')) {
                if (validateEmail(UserData.email)) {
                    setCanSave(true);
                    return;
                }
            }
            setCanSave(false);



        } else if (role === 'lecturer' && 'designation' in UserData && 'designation' in originalUserData && 'company' in UserData && 'company' in originalUserData) {

            if (checkHasNotChange('name') && checkHasNotChange('designation') && checkHasNotChange('company') && checkHasNotChange('email')) {
                setCanSave(false);
                return;
            }
            if (checkNotEmpty('name') && checkNotEmpty('designation') && checkNotEmpty('company') && checkNotEmpty('email')) {
                if (validateEmail(UserData.email)) {
                    setCanSave(true);
                    return;
                }
            }
            setCanSave(false);


        }
    };

    function checkHasNotChange(key: string) {
        if (UserData === null || originalUserData === null) {
            return false;
        }

        if ((UserData as any)[key] === (originalUserData as any)[key]) {
            return true;
        }
        return false;
    }

    const fetchData = () => {
        try {
            if (role === 'student') {
                setUserData(identity as StudentProps);
                setOriginalUserData(identity as StudentProps);
                setBatchSelected((identity as StudentProps).loginAsBatch);
            } else if (role === 'lecturer') {
                if (identity !== null && 'designation' in identity && 'company' in identity && 'role' in identity) {
                    setUserData(identity as LecturerProps);
                    setOriginalUserData(identity);
                }
            }
        } catch (error: any) {
            console.log(error.message);
            setError({ status: true, message: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    // initial fetch client data
    useEffect(() => {
        setIsLoading(true);
        fetchData();
    }, [identity]);

    function checkIsDifferenceAndNotEmpty(key: string) {
        if (UserData === null || originalUserData === null) {
            return false;
        }
        if ((UserData as any)[key] !== (originalUserData as any)[key] && (UserData as any)[key].length > 0) {
            return true;
        }
        return false
    }

    function checkNotEmpty(key: string) {
        if (UserData === null) {
            return false;
        }
        if ((UserData as any)[key].length > 0) {
            return true;
        }
        return false
    }

    const onhandleSave = async () => {
        try {
            if (UserData === null || originalUserData === null) {
                throw new Error('User data is null');
            }
            let payload = {};
            if (role === 'student' && 'matric' in UserData && 'matric' in originalUserData) {
                if (checkIsDifferenceAndNotEmpty('name')) {
                    payload = { ...payload, name: UserData.name };
                }
                if (checkIsDifferenceAndNotEmpty('matric')) {
                    payload = { ...payload, matric: UserData.matric };
                }
                if (checkIsDifferenceAndNotEmpty('email')) {
                    if (!validateEmail(UserData.email)) {
                        throw new Error('Invalid email');
                    } else {
                        payload = { ...payload, email: UserData.email };
                    }
                }

                if (Object.keys(payload).length === 0) {
                    throw new Error('No changes detected');
                }

                const result = await updateStudentProfile(payload as EditStudentProfileRequest);
                if (result) {
                    setIdentity(prevIdentity => ({ ...prevIdentity, ...payload } as StudentProps));
                    // setSuccess({ status: true, message: 'Profile updated successfully' });
                }
            } else if (role === 'lecturer' && 'designation' in UserData && 'designation' in originalUserData && 'company' in UserData && 'company' in originalUserData) {
                if (checkIsDifferenceAndNotEmpty('name')) {
                    payload = { ...payload, name: UserData.name };
                }
                if (checkIsDifferenceAndNotEmpty('designation')) {
                    payload = { ...payload, designation: UserData.designation };
                }
                if (checkIsDifferenceAndNotEmpty('company')) {
                    payload = { ...payload, company: UserData.company };
                }
                if (checkIsDifferenceAndNotEmpty('email')) {
                    if (!validateEmail(UserData.email)) {
                        throw new Error('Invalid email');
                    } else {
                        payload = { ...payload, email: UserData.email };
                    }
                }

                if (Object.keys(payload).length === 0) {
                    throw new Error('No changes detected');
                }

                const result = await updateLecturerProfile(payload as EditLecturerProfileRequest);
                if (result) {
                    setIdentity(prevIdentity => ({ ...prevIdentity, ...payload } as LecturerProps));
                    setSuccess(true);
                }
            }

        } catch (error: any) {
            console.log(error.message);
            setError({ status: true, message: error.message });
        } finally {
            setIsEdit(false);
            setIsLoading(false);
        }
    };

    const handleCancelEdit = () => {
        setUserData(originalUserData);

        setIsEdit(false);
    };

    const handleBatchChange = (s: string) => {
        setBatchSelected(s);
    };

    function capitalizeRole(role: string | null) {
        if (!role) return ''; // Handle undefined/null
        return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    };

    const handleInputChange = (key: string, value: string) => {
        setUserData((prev) => prev ? ({ ...prev, [key]: value }) : prev);
    };

    if (isLoading) {
        return (
            <ContentPanel
                title={`${capitalizeRole(role)} Profile`}
                titleIcon={<PersonIcon fontSize="large" />}
                hasBackButton={true}
                backLink={-1}
                content={
                    <div>
                        <h1>User Not Found</h1>
                    </div>
                }
            />
        );
    } else {
        return (
            <div
                className="flex flex-col gap-6"
            >
                <ContentPanel
                    title={`User Profile`}
                    titleIcon={<PersonIcon fontSize="large" />}
                    loadingPopup={loadingPopupProps}
                    successPopup={successPopupProps}
                    errorPopup={errorPopupProps}
                    hasBackButton={true}
                    backLink={-1}
                    content={
                        <div
                            className="flex flex-col gap-6"
                        >
                            <div
                                className="flex flex-row justify-end items-center"
                            >
                                {!isEdit ? <IconButton sx={{
                                    backgroundColor: 'lightgray', color: 'inherit',
                                    '&:hover': {
                                        color: '#2196F3',
                                    }
                                }} onClick={() => setIsEdit(true)}><Edit /></IconButton> : (
                                    <div className="flex flex-row gap-6">
                                        <IconButton sx={{
                                            backgroundColor: 'lightgray', color: 'inherit',
                                            '&:hover': {
                                                color: 'red',
                                            }
                                        }} onClick={handleCancelEdit}><Clear /></IconButton>
                                        <IconButton sx={{
                                            backgroundColor: 'lightgray', color: 'inherit',
                                            '&:hover': {
                                                color: 'green',
                                            }
                                        }} onClick={onhandleSave} disabled={!canSave}><Done /></IconButton>
                                    </div>
                                )}
                            </div>
                            <div
                                className="flex flex-row justify-between items-center gap-4"
                            >
                                <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>{`${capitalizeRole(role)} Name`}</Typography>
                                <Typography variant="inherit">:</Typography>
                                <EditableTextField
                                    label={`${capitalizeRole(role)} Name`}
                                    value={UserData?.name || ''}
                                    onChange={(s: string) => handleInputChange('name', s)}
                                    isEdit={isEdit}
                                    className="flex-1 text-left"
                                    helperText={UserData !== null ? (UserData.name?.length > 0 ? '' : 'Name cannot be empty') : ''}
                                />
                            </div>
                            {
                                role === 'student' && (
                                    <div
                                        className="flex flex-row justify-between items-center gap-4"
                                    >
                                        <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Matric</Typography>
                                        <Typography variant="inherit">:</Typography>
                                        {UserData && 'matric' in UserData && (
                                            <EditableTextField
                                                label="matric"
                                                value={UserData.matric || ''}
                                                onChange={(s: string) => handleInputChange('matric', s)}
                                                isEdit={isEdit}
                                                className="flex-1 text-left"
                                                helperText={UserData.matric.length > 0 ? '' : 'Matric cannot be empty'}
                                            />
                                        )}
                                    </div>
                                )
                            }

                            {
                                role === 'lecturer' && (
                                    <>
                                        <div
                                            className="flex flex-row justify-between items-center gap-4"
                                        >
                                            <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Designation</Typography>
                                            <Typography variant="inherit">:</Typography>
                                            {UserData && 'designation' in UserData && (
                                                <EditableTextField
                                                    label="Designation"
                                                    value={UserData.designation || ''}
                                                    onChange={(s: string) => handleInputChange('designation', s)}
                                                    isEdit={isEdit}
                                                    className="flex-1 text-left"
                                                    helperText={UserData !== null ? (UserData.designation.length > 0 ? '' : 'Designation cannot be empty') : ''}
                                                />
                                            )}
                                        </div>
                                        <div
                                            className="flex flex-row justify-between items-center gap-4"
                                        >
                                            <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Company</Typography>
                                            <Typography variant="inherit">:</Typography>
                                            {UserData && 'company' in UserData && (
                                                <EditableTextField
                                                    label="Company"
                                                    value={UserData.company || ''}
                                                    onChange={(s: string) => handleInputChange('company', s)}
                                                    isEdit={isEdit}
                                                    className="flex-1 text-left"
                                                    helperText={UserData !== null ? (UserData.company.length > 0 ? '' : 'Company cannot be empty') : ''}
                                                />
                                            )}
                                        </div>
                                    </>
                                )
                            }

                            <div
                                className="flex flex-row justify-between items-center gap-4"
                            >
                                <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Email</Typography>
                                <Typography variant="inherit">:</Typography>
                                <EditableTextField
                                    label="Email"
                                    value={UserData?.email || ''}
                                    onChange={(s: string) => handleInputChange('email', s)}
                                    isEdit={isEdit}
                                    className="flex-1 text-left"
                                    helperText={validateEmail(UserData?.email || '') ? '' : 'Invalid Email Address'}
                                />
                            </div>
                            <div
                                className="flex flex-row justify-between items-center gap-4"
                            >
                                <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Role</Typography>
                                <Typography variant="inherit">:</Typography>
                                <Typography className="text-left flex-1">{capitalizeRole(role) || ''}</Typography>
                            </div>
                            <div
                                className="flex flex-row justify-between items-center gap-4"
                            >
                                <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Created At</Typography>
                                <Typography variant="inherit">:</Typography>
                                <Typography className="text-left flex-1">{moment(UserData?.createdAt).format('DD/MM/YYYY h:mm:ss') || ''}</Typography>
                            </div>
                        </div>
                    }
                />
                {role === 'student' && (
                    <ContentPanel
                        title="Project Information"
                        hasBackButton={false}
                        content={
                            <div
                                className="flex flex-col gap-6"
                            >
                                <div
                                    className="flex flex-row justify-between items-start gap-4"
                                >
                                    <Typography variant="inherit" className="text-left justify-items-start py-2" sx={{ width: '30%', height: '100%' }}>Batch</Typography>
                                    <Typography variant="inherit" className="py-2">:</Typography>
                                    <SelectionBox
                                        labelId="batch"
                                        label="Batch"
                                        value={batchSelected}
                                        itemList={role === 'student' && UserData !== null && 'batch' in UserData ? UserData.batch.map((x) => x.batch) : []}
                                        onChange={handleBatchChange}
                                        className="flex-1"
                                    />
                                </div>
                                <div
                                    className="flex flex-row justify-between items-center gap-4"
                                >
                                    <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Group</Typography>
                                    <Typography variant="inherit">:</Typography>
                                    <Typography className="text-left flex-1">{UserData !== null && 'groups' in UserData && UserData.groups.find((x) => x.batch === batchSelected)?.name}</Typography>
                                </div>
                                <div
                                    className="flex flex-row justify-between items-center gap-4"
                                >
                                    <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Project</Typography>
                                    <Typography variant="inherit">:</Typography>
                                    <Typography className="text-left flex-1">{UserData !== null && 'groups' in UserData && UserData.groups.find((x) => x.batch === batchSelected)?.project?.title || '-'}</Typography>
                                </div>
                                <div
                                    className="flex flex-row justify-between items-center gap-4"
                                >
                                    <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Mark</Typography>
                                    <Typography variant="inherit">:</Typography>
                                    <Typography className="text-left flex-1">{UserData !== null && 'groups' in UserData && UserData.groups.find((x) => x.batch === batchSelected)?.project?.mark || '-'}</Typography>
                                </div>
                            </div>
                        }
                    />
                )}
            </div>
        );
    }
};

export default UserProfile;