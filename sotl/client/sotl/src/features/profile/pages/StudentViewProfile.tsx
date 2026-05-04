import ContentPanel from "../../../components/ContentPanel";
import { useProfileHooks } from '../hooks/useProfileHooks';
import { useEffect, useState } from 'react';
import PersonIcon from '@mui/icons-material/Person';
import IconButton from '@mui/material/IconButton';
import { Edit, Done, Clear } from '@mui/icons-material';
import EditableTextField from "../../../components/EditableTextField";
import SelectionBox from '../../../components/SelectionBox';
import { StudentProps } from "../../auth/context/AuthContext";
import { Typography } from "@mui/material";
import { validateEmail } from "../../../utils/validator";
import { LoadingPopupProps } from "../../../components/LoadingPopup";
import { useParams } from "react-router-dom";
import { PopupProps } from "../../../components/SuccessPopup";
import moment from 'moment';

const StudentViewProfile: React.FC = () => {
    const { studentId } = useParams<{ studentId: string }>();
    const { getStudentProfile, hookLoading } = useProfileHooks();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<{ status: boolean, message: string }>({ status: false, message: '' });
    const [batchSelected, setBatchSelected] = useState<string>('');
    const [UserData, setUserData] = useState<StudentProps | null>(null);

    const loadingPopupProps: LoadingPopupProps = {
        open: isLoading || hookLoading
    };

    const errorPopupProps: PopupProps = {
        open: error.status,
        content: error.message,
        onClose: () => setError({ status: false, message: '' })
    };

    const fetchData = async () => {
        try {
            setIsLoading(true);
            if (studentId === undefined || studentId === null) {
                throw new Error('User not found');
            }
            const result = await getStudentProfile(studentId);
            setUserData(result);
            setBatchSelected(result.loginAsBatch);
        } catch (error: any) {
            console.log(error.message);
            setError({ status: true, message: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    // initial fetch client data
    useEffect(() => {
        fetchData();
    }, []);

    const handleBatchChange = (s: string) => {
        setBatchSelected(s);
    };

    function capitalizeRole(role: string | null) {
        if (!role) return ''; // Handle undefined/null
        return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    };

    if (isLoading) {
        return (
            <ContentPanel
                title={`Student Profile`}
                titleIcon={<PersonIcon fontSize="large" />}
                hasBackButton={true}
                backLink={-1}
                content={
                    <div>
                        <h1>Student Not Found</h1>
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
                    title={`Student Profile`}
                    titleIcon={<PersonIcon fontSize="large" />}
                    loadingPopup={loadingPopupProps}
                    errorPopup={errorPopupProps}
                    hasBackButton={true}
                    backLink={-1}
                    content={
                        <div
                            className="flex flex-col gap-6"
                        >
                            <div
                                className="flex flex-row justify-between items-center gap-4"
                            >
                                <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Name</Typography>
                                <Typography variant="inherit">:</Typography>
                                <Typography className="text-left flex-1">{UserData?.name || ''}</Typography>
                            </div>
                            <div
                                className="flex flex-row justify-between items-center gap-4"
                            >
                                <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Matric</Typography>
                                <Typography variant="inherit">:</Typography>
                                <Typography className="text-left flex-1">{UserData?.matric || ''}</Typography>
                            </div>
                            <div
                                className="flex flex-row justify-between items-center gap-4"
                            >
                                <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Email</Typography>
                                <Typography variant="inherit">:</Typography>
                                <Typography className="text-left flex-1">{UserData?.email || ''}</Typography>
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
                                    itemList={UserData !== null && 'batch' in UserData ? UserData.batch.map((x) => x.batch) : []}
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
            </div>
        );
    }
};

export default StudentViewProfile;