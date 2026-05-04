import ContentPanel from "../../../../components/ContentPanel";
import { batchStudentHooks } from '../hooks/batchStudentHooks';
import { useBatchStudent, SET_LOADING_STATUS_FALSE } from '../contexts/BatchStudentContext';
import { ClientIdentityProps, GroupProject } from '../models';
import { useEffect, useState } from 'react';
import { useParams } from "react-router-dom";
import PersonIcon from '@mui/icons-material/Person';
import IconButton from '@mui/material/IconButton';
import { Edit, Done, Clear } from '@mui/icons-material';
import EditableTextField from "../../../../components/EditableTextField";
import EditableSelectionBox from "../../../../components/EditableSelectionBox";
import { Typography } from "@mui/material";
import moment from 'moment';
import _ from "lodash";

const ClientProfile: React.FC = () => {
    const { clientId } = useParams();
    const { getClientIdentity, getGroupProjectList, editClient } = batchStudentHooks();
    const { setError, setLoading, setSuccess } = useBatchStudent();
    const [groupProjectList, setGroupProjectList] = useState<GroupProject[]>([]);
    const [originalGroupProjectList, setOriginalGroupProjectList] = useState<GroupProject[]>([]);
    const [batchList, setBatchList] = useState<string[]>([]);
    const [isEdit, setIsEdit] = useState<boolean>(false);
    const [canSave, setCanSave] = useState<boolean>(false);
    const [originalClientData, setOriginalClientData] = useState<ClientIdentityProps | undefined>(undefined);
    const [clientData, setClientData] = useState<ClientIdentityProps>({
        _id: '',
        name: '',
        designation: '',
        batch: '',
        company: '',
        role: '',
        email: '',
        project: {
            _id: '',
            title: ''
        },
        group: {
            _id: '',
            name: ''
        },
        created_at: new Date()
    });

    // Helper function to check if any properties are empty strings ("").
    const hasNoEmptyProperties = (obj: ClientIdentityProps | undefined): boolean => {
        if (!obj) return false; // In case the object is undefined

        return Object.values(obj).every((value) => {
            if (typeof value === 'string') return value.trim() !== ''; // Check for empty strings
            if (typeof value === 'object' && value !== null) {
                // Recursively check nested objects like `group` and `project`
                return hasNoEmptyProperties(value);
            }
            return true; // For non-string values, just return true
        });
    };

    // Handle Can Save: Check if the clientData is different from the originalClientData
    useEffect(()=> {
        if (!_.isEqual(clientData, originalClientData) && hasNoEmptyProperties(clientData)) {
            setCanSave(true);
        } else {
            setCanSave(false);
        }
    }, [clientData]);

    const fetchData = async () => {
        try {
            if (clientId === undefined || clientId === null) {
                throw new Error('Client Id is not found');
            }
            let result = await getClientIdentity(clientId);
            setOriginalClientData(result);
            setClientData(result);
            console.log(result);
        } catch (e: any) {
            setError({ status: true, message: e.message });
        } finally {
            setLoading(SET_LOADING_STATUS_FALSE);
        }
    };

    const cancelEdit = () => {
        if (originalClientData !== undefined) {
            setClientData(originalClientData);
        }
        setIsEdit(false);
    };

    // initial fetch client data
    useEffect(() => {
        fetchData();
    }, []);

    // initial fetch group project list used for editing batch and project
    useEffect(() => {
        fetchGroupProjectList();
    }, []);

    const fetchGroupProjectList = async () => {
        try {
            let result = await getGroupProjectList();
            setOriginalGroupProjectList(result);
            setGroupProjectList(result);
            const uniqueBatches = Array.from(
                new Set(result.map((item: GroupProject) => item.batch))
            );
            setBatchList(uniqueBatches);
        } catch (e: any) {
            setError({ status: true, message: e.message });
        } finally {
            setLoading(SET_LOADING_STATUS_FALSE);
        }
    };

    // Edit - Batch
    const onHandleBatchChange = (s: string) => {
        let filtered = originalGroupProjectList.filter((item: GroupProject) => item.batch === s && item.project._id != undefined);
        setGroupProjectList(filtered);
        setClientData({
            ...clientData,
            batch: s,
            project: { _id: '', title: '' },
            group: { _id: '', name: '' }
        });
    }

    const onhandleSave = async () => {
        try {
            if (clientData === undefined) {
                throw new Error('Client Data is not found');
            } else if (clientId === '' || clientId === null || clientId === undefined) {
                throw new Error('Client Id is not found');
            }
            setLoading({ status: true, message: null });
            let result = await editClient(clientId, {
                name: clientData.name,
                designation: clientData.designation,
                company: clientData.company,
                email: clientData.email,
                projectId: clientData.project._id
            });
            if (result) {        
                setSuccess({ status: true, message: 'Client updated successfully' });
            }
        } catch (error: any) {
            console.log(error);
            setError({ status: true, message: error.response.data?.message });
        } finally {
            setIsEdit(false);
            setLoading(SET_LOADING_STATUS_FALSE);
        }
    };

    if (clientData === undefined) {
        return (
            <ContentPanel
                title="Client Profile"
                titleIcon={<PersonIcon fontSize="large" />}
                hasBackButton={true}
                backLink={-1}
                content={
                    <div>
                        <h1>Client Not Found</h1>
                    </div>
                }
            />
        );
    }

    return (
        <ContentPanel
            title="Client Profile"
            titleIcon={<PersonIcon fontSize="large" />}
            hasBackButton={true}
            backLink={-1}
            content={
                <div
                    className="flex flex-col gap-6"
                >
                    <div
                        className="flex flex-row justify-end items-center"
                    >
                        {!isEdit ? <IconButton sx={{ backgroundColor: 'lightgray', color: 'inherit',
                            '&:hover': {
                                color: '#2196F3',
                            } }} onClick={() => setIsEdit(true)}><Edit /></IconButton> : (
                            <div className="flex flex-row gap-6">
                                <IconButton sx={{ backgroundColor: 'lightgray',color: 'inherit',
                            '&:hover': {
                                color: 'red',
                            } }} onClick={cancelEdit}><Clear /></IconButton>
                                <IconButton sx={{ backgroundColor: 'lightgray', color: 'inherit',
                            '&:hover': {
                                color: 'green',
                            } }} onClick={onhandleSave} disabled={!canSave}><Done /></IconButton>
                            </div>
                        )}
                    </div>
                    <div
                        className="flex flex-row justify-between items-center gap-4"
                    >
                        <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Client Name</Typography>
                        <Typography variant="inherit">:</Typography>
                        <EditableTextField
                            label="Client Name"
                            value={clientData?.name || ''}
                            onChange={(s: string) => setClientData({ ...clientData, name: s })}
                            isEdit={isEdit}
                            className="flex-1 text-left"
                        />
                    </div>
                    <div
                        className="flex flex-row justify-between items-center gap-4"
                    >
                        <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Designation</Typography>
                        <Typography variant="inherit">:</Typography>
                        <EditableTextField
                            label="Designation"
                            value={clientData?.designation || ''}
                            onChange={(s: string) => setClientData({ ...clientData, designation: s })}
                            isEdit={isEdit}
                            className="flex-1 text-left"
                        />
                    </div>
                    <div
                        className="flex flex-row justify-between items-center gap-4"
                    >
                        <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Company</Typography>
                        <Typography variant="inherit">:</Typography>
                        <EditableTextField
                            label="Company"
                            value={clientData?.company || ''}
                            onChange={(s: string) => setClientData({ ...clientData, company: s })}
                            isEdit={isEdit}
                            className="flex-1 text-left"
                        />
                    </div>
                    <div
                        className="flex flex-row justify-between items-center gap-4"
                    >
                        <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Email</Typography>
                        <Typography variant="inherit">:</Typography>
                        <EditableTextField
                            label="Email"
                            value={clientData?.email || ''}
                            onChange={(s: string) => setClientData({ ...clientData, email: s })}
                            isEdit={isEdit}
                            className="flex-1 text-left"
                        />
                    </div>
                    <div
                        className="flex flex-row justify-between items-center gap-4"
                    >
                        <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Batch</Typography>
                        <Typography variant="inherit">:</Typography>
                        <EditableSelectionBox
                            labelId="batch"
                            label="Batch"
                            value={clientData?.batch || ''}
                            onChange={onHandleBatchChange}
                            itemList={batchList}
                            isEdit={false}
                            className="flex-1 text-left"
                        />
                    </div>
                    <div
                        className="flex flex-row justify-between items-center gap-4"
                    >
                        <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Project</Typography>
                        <Typography variant="inherit">:</Typography>
                        <EditableSelectionBox
                            labelId="project"
                            label="Project"
                            value={clientData?.project._id || ''}
                            onChange={(s: string) => {
                                let gp = groupProjectList.find((x) => x.project._id === s);
                                setClientData({
                                    ...clientData,
                                    project: { _id: s, title: gp?.project.title || '' },
                                    group: { _id: gp?._id || '', name: gp?.name || '' }
                                })
                            }}
                            projectList={groupProjectList}
                            isEdit={false}
                            className="flex-1 text-left"
                        />
                    </div>
                    <div
                        className="flex flex-row justify-between items-center gap-4"
                    >
                        <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Group</Typography>
                        <Typography variant="inherit">:</Typography>
                        <Typography className="text-left flex-1">{clientData.group.name}</Typography>
                    </div>
                    <div
                        className="flex flex-row justify-between items-center gap-4"
                    >
                        <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Created At</Typography>
                        <Typography variant="inherit">:</Typography>
                        <Typography className="text-left flex-1">{moment(clientData?.created_at).format('DD/MM/YYYY h:mm:ss') || ''}</Typography>
                    </div>
                </div>
            }
        />
    );
};

export default ClientProfile;