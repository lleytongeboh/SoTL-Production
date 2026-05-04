import ContentPanel from "../../../../components/ContentPanel";
import DataTable, { ExpanderComponentProps, TableColumn } from 'react-data-table-component';
import { batchStudentHooks } from '../hooks/batchStudentHooks';
import { useBatchStudent, SET_LOADING_STATUS_FALSE } from '../contexts/BatchStudentContext';
import { StudentFromLecturerViewProps, Batch, EditStudentPayload, SelfAssessmentResult, PeerAssessmentResult } from '../models';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { Pageview, Delete } from '@mui/icons-material';
import PersonIcon from '@mui/icons-material/Person';
import IconButton from '@mui/material/IconButton';
import { Edit, Done, Clear, Send } from '@mui/icons-material';
import EditableTextField from "../../../../components/EditableTextField";
import EditableRowContainer from "../components/EditableRowContainer";
import { Typography } from "@mui/material";
import moment from 'moment';
import _ from "lodash";
import ConfirmDeleteDialog from "../../../../components/ConfirmDeleteDialog";

const StudentProfile: React.FC = () => {
    const navigator = useNavigate();
    const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
    const [deleteMessage, setDeleteMessage] = useState<string|null>(null);
    const [deleteId, setDeleteId] = useState<{id: string; type: number;}|null>(null)
    const { studentId } = useParams();
    const { getStudent, getBatchList, editStudent, resendStudentEmail, getSelfAssessmentResult, getPeerAssessmentResult, getClientEvaluationResult, removeAssessmentResult } = batchStudentHooks();
    const { setError, setLoading, setSuccess } = useBatchStudent();
    const [isEdit, setIsEdit] = useState<boolean>(false);
    const [canSave, setCanSave] = useState<boolean>(false);
    const [batchSelected, setBatchSelected] = useState<string>('');
    const [batchList, setBatchList] = useState<Batch[]>([]);
    const [password, setPassword] = useState<string>('');
    const [originalStudentData, setOriginalStudentData] = useState<StudentFromLecturerViewProps | undefined>(undefined);
    const [selfAssessmentResultData, setSelfAssessmentResultData] = useState<SelfAssessmentResult[]>([]);
    const [peerAssessmentResultData, setPeerAssessmentResultData] = useState<PeerAssessmentResult[]>([]);
    const [clientEvaluationResultData, setClientEvaluationResultData] = useState<PeerAssessmentResult[]>([]);
    const [isSelfAssessmentResultDisplay, setIsSelfAssessmentResultDisplay] = useState<boolean>(false);
    const [isPeerAssessmentResultDisplay, setIsPeerAssessmentResultDisplay] = useState<boolean>(false);
    const [isClientEvaluationResultDisplay, setIsClientEvaluationResultDisplay] = useState<boolean>(false);
    const [studentData, setStudentData] = useState<StudentFromLecturerViewProps>({
        _id: '',
        name: '',
        email: '',
        createdAt: new Date(),
        lastLogin: null,
        matric: '',
        batch: [],
        loginAsBatch: '',
        groups: [],
        emailSentAt: null
    });
    // Handle Can Save: Check if the clientData is different from the originalClientData
    useEffect(() => {
        checkCanSave();
    }, [studentData, password]);

    const checkCanSave = () => {
        if (originalStudentData === undefined) {
            return;
        }
        const { name, email, matric } = studentData;
        const { name: originalName, email: originalEmail, matric: originalMatric } = originalStudentData;

        // Check if these fields are different and their length is more than 0
        const hasDifference =
            (name !== originalName && name.length > 0) ||
            (email !== originalEmail && email.length > 0) ||
            (matric !== originalMatric && matric.length > 0) ||
            (password !== '' && password.length > 0);

        setCanSave(hasDifference);
    };

    const fetchData = async () => {
        try {
            if (studentId === undefined || studentId === null) {
                throw new Error('Student Id is not found');
            }
            const result = await getStudent(studentId);
            setOriginalStudentData(result);
            setStudentData(result);
            setBatchSelected(result.batch.find((x) => x.batch === result.loginAsBatch)?.batch || '');

        } catch (e: any) {
            setError({ status: true, message: e.message });
        } finally {
            setLoading(SET_LOADING_STATUS_FALSE);
        }
    };

    // initial fetch client data
    useEffect(() => {
        fetchData();
    }, []);

    // Fetch Assessment Result Data
    useEffect(() => {
        if (originalStudentData !== undefined) {
            fetchAllAssessmentData();
        }

    }, [originalStudentData, batchSelected]);

    const fetchAllAssessmentData = async () => {
        try {

            await fetchSelfAssessmentResult();
            await fetchPeerAssessmentResult();
            await fetchClientEvaluationResult();

        } catch (e: any) {
            console.error("Error while fetching data:", e.message);
            setError({ status: true, message: e.message });
        }
    };

    const fetchSelfAssessmentResult = async () => {
        try {
            if (studentId === undefined || studentId === null) {
                throw new Error('Student Id is not found');
            }
            if (batchSelected === '') {
                throw new Error('Batch is not found');
            }

            const result = await getSelfAssessmentResult(studentId, batchSelected);

            setSelfAssessmentResultData(result);
            setIsSelfAssessmentResultDisplay(true);
        } catch (error: any) {
            throw new Error(error.message);
        }
    };

    const fetchPeerAssessmentResult = async () => {
        try {
            if (studentId === undefined || studentId === null) {
                throw new Error('Student Id is not found');
            }
            if (batchSelected === '') {
                throw new Error('Batch is not found');
            }

            const result = await getPeerAssessmentResult(studentId, batchSelected);
            setPeerAssessmentResultData(result);
            setIsPeerAssessmentResultDisplay(true);
        } catch (error: any) {
            throw new Error(error.message);
        }
    };

    const fetchClientEvaluationResult = async () => {
        try {
            if (studentId === undefined || studentId === null) {
                throw new Error('Student Id is not found');
            }
            if (batchSelected === '') {
                throw new Error('Batch is not found');
            }

            const groupId = originalStudentData?.groups.find((x) => x.batch === batchSelected)?._id;
            if (groupId === undefined) {
                return;
            }
            console.log('groupId', groupId);
            const result = await getClientEvaluationResult(groupId, batchSelected);
            setClientEvaluationResultData(result);
            setIsClientEvaluationResultDisplay(true);
        } catch (error: any) {
            throw new Error(error.message);
        }
    };

    // Fetch Batch List for editing
    useEffect(() => {
        if (studentData !== undefined) {
            fetchBatchList();
        }
    }, [studentData]);

    const fetchBatchList = async () => {
        try {
            const result = await getBatchList();
            setBatchList(result);
        } catch (e: any) {
            setError({ status: true, message: e.response.data?.message });
        } finally {
            setLoading(SET_LOADING_STATUS_FALSE);
        }
    };

    const handleResendEmail = async () => {
        try {
            if (studentId === undefined || studentId === null) {
                throw new Error('Student Id is not found');
            }
            setLoading({ status: true, message: 'Resending email' });
            const result = await resendStudentEmail(studentId);
            if (result) {
                setSuccess({ status: true, message: 'Email has been sent' });
            }
        } catch (error: any) {
            setError({ status: true, message: error.response.data?.message });
        } finally {
            setLoading(SET_LOADING_STATUS_FALSE);
        }
    };

    const onhandleSave = async () => {
        try {
            if (studentId === undefined || studentId === null) {
                throw new Error('Student Id is not found');
            }

            const editStudentPayload: EditStudentPayload = {};
            if (studentData.name !== originalStudentData?.name) {
                editStudentPayload.name = studentData.name;
            }
            if (studentData.email !== originalStudentData?.email) {
                editStudentPayload.email = studentData.email;
            }
            if (studentData.matric !== originalStudentData?.matric) {
                editStudentPayload.matric = studentData.matric;
            }
            if (password.length > 0) {
                editStudentPayload.password = password;
            }

            editStudentPayload.batches = studentData.batch.map((x) => x.batch);

            setLoading({ status: true, message: 'Updating student' });
            const result = await editStudent(studentId, editStudentPayload);
            if (result && originalStudentData !== undefined) {
                if (editStudentPayload.name !== undefined) {
                    setOriginalStudentData({ ...originalStudentData, name: editStudentPayload.name });
                }
                if (editStudentPayload.email !== undefined) {
                    setOriginalStudentData({ ...originalStudentData, email: editStudentPayload.email });
                }
                if (editStudentPayload.matric !== undefined) {
                    setOriginalStudentData({ ...originalStudentData, matric: editStudentPayload.matric });
                }
                if (editStudentPayload.batches !== undefined) {
                    setOriginalStudentData({ ...originalStudentData, batch: editStudentPayload.batches.map((x) => ({ _id: '', batch: x })) });
                }
                setSuccess({ status: true, message: 'Student has been updated' });
            }
        } catch (error: any) {
            console.log(error);
            setError({ status: true, message: error.response.data?.message });
        } finally {
            setIsEdit(false);
            setLoading(SET_LOADING_STATUS_FALSE);
        }
    };

    const handleCancelEdit = () => {
        if (originalStudentData !== undefined) {
            setStudentData(originalStudentData);
        }
        setBatchSelected(originalStudentData?.batch.find((x) => x.batch === originalStudentData.loginAsBatch)?.batch || '');
        setPassword('');
        setIsEdit(false);
    };

    const handleBatchChange = (s: string) => {
        setBatchSelected(s);
    }

    const onHandleRemoveBatch = (batch: string) => {
        if (batch === batchSelected) {
            setBatchSelected('');
        }
        setStudentData({
            ...studentData,
            batch: studentData.batch.filter((x) => x.batch !== batch)
        });
    }

    const handleAddBatchChanges = (s: string) => {
        setStudentData({
            ...studentData,
            batch: [...studentData.batch, { _id: '', batch: s }]
        })
    }

    // type 0 = self assessment, type 1 = peer assessment, type 2 = client evaluation
    const onHandleDeleteAssementResult = async () => {
        try {
            if (deleteId === null) {
                throw new Error('Assessment Result Id is not found');
            }
            setLoading({ status: true, message: 'Deleting assessment result' });
            const result = await removeAssessmentResult(deleteId.id);
            if(result) {
                if(deleteId.type === 0) {
                    setSelfAssessmentResultData(selfAssessmentResultData.filter((x) => x._id !== deleteId.id));
                }else if(deleteId.type === 1) {
                    setPeerAssessmentResultData(peerAssessmentResultData.filter((x) => x.as_id !== deleteId.id));
                }else if(deleteId.type === 2) {
                    setClientEvaluationResultData(clientEvaluationResultData.filter((x) => x.as_id !== deleteId.id));
                }
                setSuccess({ status: true, message: 'Assessment result has been deleted' });
            }
        } catch (error: any) {
            setError({ status: true, message: error.response.data?.message });
        } finally {
            setLoading(SET_LOADING_STATUS_FALSE);
            setOpenDeleteDialog(false);
        }
    };

    const onHandleDeleteARTrigger = (id: string, type: number) => {
        setDeleteId({id: id, type: type});
        if(type === 0) {
            setDeleteMessage('Self Assessment');
        }else if(type === 1) {
            setDeleteMessage('Peer Assessment');
        }else if(type === 2) {
            setDeleteMessage('Client Evaluation');
        }
        setOpenDeleteDialog(true);
    };

    const onViewSelfAssessment = (row: any) => {
      navigator(`/lecturer/assessment-result/${row.assessmentId}/review?evaluatorId=${studentId}`);  
    };

    const onViewPeerAssessment = (row: any) => {
        navigator(`/lecturer/assessment-result/${row.as_id}/review?evaluatorId=${row.evaluator._id}&evaluateeId=${studentId}`);
    };

    const onViewClientEvaluation = (row: any) => {
        navigator(`/lecturer/assessment-result/${row.as_id}/review?clientAccessCode=${row.evaluator.accessCode}`);
    };

    const customStyles = {
        headCells: {
            style: {
                backgroundColor: '#F6F6F6',  // Header background color
                color: 'black',              // Header text color
                fontSize: '16px',            // Optional: adjust font size
                fontWeight: 'bold',          // Optional: make text bold
            }
        }
    };

    const selfAssessmentTableExpandedComponent: React.FC<ExpanderComponentProps<SelfAssessmentResult>> = ({ data }) => {
        return (
            <div
                className="flex flex-col"
            >
                <div
                    className="flex flex-row justify-end items-center gap-4 pr-5"
                >
                    <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Point:</Typography>
                    <Typography className="text-right">{data.point}</Typography>
                </div>
                <div
                    className="flex flex-row justify-end items-center gap-4 pr-5"
                >
                    <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Score:</Typography>
                    <Typography className="text-right">{data.score}</Typography>
                </div>
                <div
                    className="flex flex-row justify-end items-center gap-4 pr-5"
                >
                    <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Correct:</Typography>
                    <Typography className="text-right">{data.correct}</Typography>
                </div>
            </div>
        );
    };

    const selfAssessmentTableColumn: TableColumn<SelfAssessmentResult>[] = [
        {
            name: 'No',
            selector: (_, rowIndex?: number) => (rowIndex !== undefined ? rowIndex + 1 : 0),
        },
        {
            name: 'Assessment',
            selector: row => row.assessmentName,
        },
        {
            name: 'Time Completion',
            selector: row => {
                const duration = moment(row.endedAt).diff(moment(row.startedAt), 'seconds');
                const minutes = Math.floor(duration / 60);
                const seconds = duration % 60;
                const formattedDuration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                return formattedDuration;
            },
        },
        {
            name: 'Time Submission',
            selector: row => moment(row.endedAt).fromNow(),
        },
        {
            name: 'Actions',
            cell: (row) => (
                <>
                    <div
                        className="flex flex-row justify-evenly items-center"
                        style={{ width: '100%' }}
                    >
                        <IconButton sx={{ backgroundColor: 'lightgray' }} onClick={() => onViewSelfAssessment(row)}>
                            <Pageview />
                        </IconButton>
                        <IconButton sx={{
                            backgroundColor: 'transparent', '&:hover': {
                                color: 'red',
                            }
                        }} onClick={() => onHandleDeleteARTrigger(row._id, 0)}>
                            <Delete />
                        </IconButton>
                    </div>

                </>
            ),
            ignoreRowClick: true // Prevents row click event from firing when clicking on the buttons
        }
    ];

    const peerEvaluationTableColumns: TableColumn<PeerAssessmentResult>[] = [
        {
            name: 'No',
            selector: (_, rowIndex?: number) => (rowIndex !== undefined ? rowIndex + 1 : 0),
        },
        {
            name: 'Peer Name',
            selector: row => row.evaluator.name,
        },
        {
            name: 'Score',
            selector: row => row.score,
        },
        {
            name: 'Time Submission',
            selector: row => moment(row.endedAt).fromNow(),
        },
        {
            name: 'Actions',
            cell: (row) => (
                <>
                    <div
                        className="flex flex-row justify-evenly items-center"
                        style={{ width: '100%' }}
                    >
                        <IconButton sx={{ backgroundColor: 'lightgray' }} onClick={() => onViewPeerAssessment(row)}>
                            <Pageview />
                        </IconButton>
                        <IconButton sx={{
                            backgroundColor: 'transparent', '&:hover': {
                                color: 'red',
                            }
                        }} onClick={() => onHandleDeleteARTrigger(row.as_id, 1)}>
                            <Delete />
                        </IconButton>
                    </div>

                </>
            ),
            ignoreRowClick: true // Prevents row click event from firing when clicking on the buttons
        }
    ];

    const clientEvaluationTableColumns: TableColumn<PeerAssessmentResult>[] = [
        {
            name: 'No',
            selector: (_, rowIndex?: number) => (rowIndex !== undefined ? rowIndex + 1 : 0),
        },
        {
            name: 'Client Name',
            selector: row => row.evaluator.name,
        },
        {
            name: 'Score',
            selector: row => row.score,
        },
        {
            name: 'Time Submission',
            selector: row => moment(row.endedAt).fromNow(),
        },
        {
            name: 'Actions',
            cell: (row) => (
                <>
                    <div
                        className="flex flex-row justify-evenly items-center"
                        style={{ width: '100%' }}
                    >
                        <IconButton sx={{ backgroundColor: 'lightgray' }} onClick={() => onViewClientEvaluation(row)}>
                            <Pageview />
                        </IconButton>
                        <IconButton sx={{
                            backgroundColor: 'transparent', '&:hover': {
                                color: 'red',
                            }
                        }} onClick={() => onHandleDeleteARTrigger(row.as_id, 2)}>
                            <Delete />
                        </IconButton>
                    </div>

                </>
            ),
            ignoreRowClick: true // Prevents row click event from firing when clicking on the buttons
        }
    ];

    // Peer Suggested Mark
    const peerScore = _.sumBy(peerAssessmentResultData, 'score');
    const peerTotalScore = _.sumBy(peerAssessmentResultData, 'totalScore');
    const peerSuggestedMark = (peerScore / peerTotalScore) * 50;

    // Client Suggested Mark
    const clientScore = _.sumBy(clientEvaluationResultData, 'score');
    const clientTotalScore = _.sumBy(clientEvaluationResultData, 'totalScore');
    const clientSuggestedMark = (clientScore / clientTotalScore) * 50;

    if (studentData === undefined) {
        return (
            <ContentPanel
                title="Student Profile"
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
    }

    return (
        <div
            className="flex flex-col gap-6"
        >
            <ContentPanel
                title="Student Profile"
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
                            <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Student Name</Typography>
                            <Typography variant="inherit">:</Typography>
                            <EditableTextField
                                label="Student Name"
                                value={studentData?.name || ''}
                                onChange={(s: string) => setStudentData({ ...studentData, name: s })}
                                isEdit={isEdit}
                                className="flex-1 text-left"
                            />
                        </div>
                        <div
                            className="flex flex-row justify-between items-center gap-4"
                        >
                            <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Matric</Typography>
                            <Typography variant="inherit">:</Typography>
                            <EditableTextField
                                label="matric"
                                value={studentData?.matric || ''}
                                onChange={(s: string) => setStudentData({ ...studentData, matric: s })}
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
                                value={studentData?.email || ''}
                                onChange={(s: string) => setStudentData({ ...studentData, email: s })}
                                isEdit={isEdit}
                                className="flex-1 text-left"
                            />
                        </div>
                        {
                            isEdit && (
                                <div
                                    className="flex flex-row justify-between items-center gap-4"
                                >
                                    <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Password</Typography>
                                    <Typography variant="inherit">:</Typography>
                                    <EditableTextField
                                        label="Password"
                                        value={password}
                                        onChange={(s: string) => setPassword(s)}
                                        isEdit={isEdit}
                                        className="flex-1 text-left"
                                    />
                                </div>
                            )
                        }
                        <div
                            className="flex flex-row justify-between items-center gap-4"
                        >
                            <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Created At</Typography>
                            <Typography variant="inherit">:</Typography>
                            <Typography className="text-left flex-1">{moment(studentData?.createdAt).format('DD/MM/YYYY h:mm:ss') || ''}</Typography>
                        </div>
                        <div
                            className="flex flex-row justify-between items-center gap-4"
                        >
                            <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Email Sent At</Typography>
                            <Typography variant="inherit">:</Typography>
                            <div
                                className="text-left flex-1 flex flex-row justify-start gap-4 items-center"
                            >
                                <Typography>{(studentData?.emailSentAt === null || studentData?.emailSentAt === undefined) ? '-' : moment(studentData?.emailSentAt).format('DD/MM/YYYY h:mm:ss')}</Typography>
                                <IconButton
                                    onClick={handleResendEmail}
                                >
                                    <Send />
                                </IconButton>
                            </div>
                        </div>
                        <div
                            className="flex flex-row justify-between items-center gap-4"
                        >
                            <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Last Login At</Typography>
                            <Typography variant="inherit">:</Typography>
                            <Typography className="text-left flex-1">{studentData?.lastLogin !== null ? moment(studentData?.lastLogin).format('DD/MM/YYYY h:mm:ss') : '-'}</Typography>
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
                            <EditableRowContainer
                                labelId="batch"
                                label="Batch"
                                value={batchSelected}
                                itemList={studentData.batch.map((x) => x.batch)}
                                isEdit={false}
                                onRemove={onHandleRemoveBatch}
                                onChange={handleBatchChange}
                                className="flex-1"
                                onAddBatchChange={handleAddBatchChanges}
                                itemList2={batchList.filter(
                                    (a) => !studentData.batch.some((b) => a.batch === b.batch)
                                ).map((x) => x.batch)}
                            />
                        </div>
                        <div
                            className="flex flex-row justify-between items-center gap-4"
                        >
                            <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Group</Typography>
                            <Typography variant="inherit">:</Typography>
                            <Typography className="text-left flex-1">{studentData.groups.find((x) => x.batch === batchSelected)?.name || '-'}</Typography>
                        </div>
                        <div
                            className="flex flex-row justify-between items-center gap-4"
                        >
                            <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Project</Typography>
                            <Typography variant="inherit">:</Typography>
                            <Typography className="text-left flex-1">{studentData.groups.find((x) => x.batch === batchSelected)?.project?.title || '-'}</Typography>
                        </div>
                        <div
                            className="flex flex-row justify-between items-center gap-4"
                        >
                            <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Mark</Typography>
                            <Typography variant="inherit">:</Typography>
                            <Typography className="text-left flex-1">{(studentData.groups !== undefined && studentData.groups.length > 0 && studentData.groups.find((x) => x.batch === batchSelected)?.project?.mark) ?? '-'}</Typography>
                        </div>
                    </div>
                }
            />
            {
                isSelfAssessmentResultDisplay && (
                    <ContentPanel
                        title="Individual Assessment"
                        hasBackButton={false}
                        content={
                            <div>
                                <DataTable columns={selfAssessmentTableColumn} data={selfAssessmentResultData} expandableRows expandableRowsComponent={selfAssessmentTableExpandedComponent} pagination customStyles={customStyles} />
                            </div>
                        }
                    />
                )
            }
            {
                isPeerAssessmentResultDisplay && (
                    <ContentPanel
                        title="Peer Evaluation"
                        hasBackButton={false}
                        content={
                            <div
                                className="flex flex-col"
                            >
                                <DataTable columns={peerEvaluationTableColumns} data={peerAssessmentResultData} pagination customStyles={customStyles} />
                                <div
                                    className="flex flex-row justify-end items-center gap-4 pr-5"
                                >
                                    <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Total Score:</Typography>
                                    <Typography variant="inherit">{peerScore} / {peerTotalScore}</Typography>
                                </div>
                                <div
                                    className="flex flex-row justify-end items-center gap-4 pr-5"
                                >
                                    <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Suggest Mark:</Typography>
                                    <Typography variant="inherit">{peerSuggestedMark.toFixed(2)} / 50</Typography>
                                </div>
                            </div>
                        }
                    />
                )
            }
            {
                isClientEvaluationResultDisplay && (
                    <ContentPanel
                        title="Client Evaluation"
                        hasBackButton={false}
                        content={
                            <div
                                className="flex flex-col"
                            >
                                <DataTable columns={clientEvaluationTableColumns} data={clientEvaluationResultData} pagination customStyles={customStyles} />
                                <div
                                    className="flex flex-row justify-end items-center gap-4 pr-5"
                                >
                                    <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Total Score:</Typography>
                                    <Typography variant="inherit">{clientScore} / {clientTotalScore}</Typography>
                                </div>
                                <div
                                    className="flex flex-row justify-end items-center gap-4 pr-5"
                                >
                                    <Typography variant="inherit" className="text-left" sx={{ width: '30%' }}>Suggest Mark:</Typography>
                                    <Typography variant="inherit">{clientSuggestedMark.toFixed(2)} / 50</Typography>
                                </div>
                            </div>
                        }
                    />
                )
            }
            <ConfirmDeleteDialog open={openDeleteDialog} setOpen={setOpenDeleteDialog} deleteData={deleteMessage} setDeleteData={setDeleteMessage} handleDelete={onHandleDeleteAssementResult} />
        </div >
    );
};

export default StudentProfile;