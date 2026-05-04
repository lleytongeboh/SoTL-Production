import ContentPanel from "../../../../components/ContentPanel";
import { GridColDef, DataGrid } from '@mui/x-data-grid';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import PageviewIcon from '@mui/icons-material/Pageview';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ConfirmDeleteDialog from "../../../../components/ConfirmDeleteDialog";
import DescriptionIcon from '@mui/icons-material/Description';
import Switch from '@mui/material/Switch';
import { useParams } from "react-router-dom";
import { batchStudentHooks } from '../hooks/batchStudentHooks';
import { useBatchStudent, SET_LOADING_STATUS_FALSE } from '../contexts/BatchStudentContext';
import { BatchStudent } from '../models';
import ConfirmationPopup from "../../../../components/ConfirmationPopup";

const StudentManagement: React.FC = () => {
    // delete relevant state
    const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);

    const navigate = useNavigate();
    let { batchId } = useParams();
    const { batchStudent, batchStudentDispatch, setError, setLoading, setSuccess } = useBatchStudent();
    const [rows, setRows] = useState<any[]>([]);
    const [batchName, setBatchName] = useState<string>('');
    const { removeStudent, editBatchVisibleMark } = batchStudentHooks();
    const [openToggleDialog, setOpenToggleDialog] = useState<boolean>(false);
    const [toggleDialogContent, setToggleDialogContent] = useState<string>('');
    const [VisibleMarkChecked, setVisibleMarkChecked] = useState<boolean>(false);
    const [tempVisibleMarkStatus, setTempVisibleMarkStatus] = useState<boolean | null>(null);

    // toggle Mark Visible Related callback
    const cleanToggleInfo = () => {
        setTempVisibleMarkStatus(null);
        setToggleDialogContent('');
        setOpenToggleDialog(false)
    }

    const onCloseToggleDialog = () => {
        setOpenToggleDialog(false);
    }

    const handleToggleVisibleMarkChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
        let visibleText = event.target.checked ? 'visible' : 'invisible';
        let contentText = `Make mark ${visibleText} to student. Are you sure?`;
        setTempVisibleMarkStatus(event.target.checked);
        setToggleDialogContent(contentText);
        setOpenToggleDialog(true);

    }

    const onConfirmToggleVisibleMark = async () => {
        try {
            if (batchId === undefined || batchId === null) {
                throw new Error('Batch Id is not found');
            } else if (tempVisibleMarkStatus === null) {
                throw new Error('Visible Mark Status is not found');
            }
            setLoading({ status: true, message: null });
            const result = await editBatchVisibleMark(batchId, tempVisibleMarkStatus);
            if (result) {
                batchStudentDispatch({
                    type: 'TOGGLE_MARK', payload: {
                        batch: {
                            _id: batchId,
                            name: batchName
                        },
                        visible: tempVisibleMarkStatus
                    }
                });
                setSuccess({ status: true, message: 'Mark visibility changed successfully' });
            }
        } catch (error: any) {
            setError({ status: true, message: error.message });
        } finally {
            cleanToggleInfo();
            setLoading(SET_LOADING_STATUS_FALSE);
        }
    }

    // useEffect to fetch data when batchStudent is updated
    useEffect(() => {
        fetchData();
    }, [batchStudent]);

    // Fetch data
    const fetchData = () => {
        setLoading({ status: true, message: null });
        try {
            const batchData = batchStudent.find((item: BatchStudent) => item._id === batchId);
            const batchSelected = batchData.batch;
            setBatchName(batchSelected);
            const data = batchData.belonged.map((item: any, index: number) => {
                let t_group = item.groups[0].name === undefined ? 'N/A' : item.groups.find((group: any) => group.batch === batchSelected);
                let t_group_name = t_group === undefined ? 'N/A' : t_group.name;
                return {
                    _id: item._id,
                    no: index + 1,
                    name: item.name,
                    email: item.email,
                    batch: batchSelected,
                    group: t_group_name,
                }
            });
            setVisibleMarkChecked(batchData.visibleMark);
            setRows(data);
        } catch (error: any) {
            console.log(error);
            setError({ status: true, message: error.message });
        } finally {
            setLoading(SET_LOADING_STATUS_FALSE);
        }
    }

    // Handle Delete Student
    const onDeleteButtonClick = (_: React.MouseEvent, row: any) => {
        setDeleteId(row._id);
        setDeleteMessage(`${row.name} with email ${row.email}`);
        setOpenDeleteDialog(true);
        setConfirmDelete(false);
    }

    console.log('batchStudent length', batchStudent.find((item: BatchStudent) => item._id === batchId).belonged.length);

    const handleDelete = async () => {
        // Delete the data
        setOpenDeleteDialog(false);
        try {
            if (deleteId === null) {
                throw new Error('No Student ID is added');
            }
            const batchData = batchStudent.find((item: BatchStudent) => item._id === batchId);
            const StudentSelected = batchData.belonged.find((item: any) => item._id === deleteId);
            if (StudentSelected === undefined) {
                throw new Error('Student not found here');
            }
            setLoading({ status: true, message: null });
            const result = await removeStudent(deleteId, {batch: batchName, confirmDelete: confirmDelete});
            if (typeof result === 'boolean' && result) {
                batchStudentDispatch({
                    type: 'DELETE_STUDENT', payload: {
                        student: {
                            _id: deleteId,
                        },
                        batch: {
                            _id: batchId
                        }
                    }
                });
                
                cleanDeleteDialogInfo();
                setSuccess({ status: true, message: 'Student deleted successfully' });
            } else if (typeof result === 'string') {
                
                setConfirmDelete(true);
                setDeleteMessage(result);
                setOpenDeleteDialog(true);
            }
        } catch (error: any) {
            setLoading(SET_LOADING_STATUS_FALSE);
            cleanDeleteDialogInfo();
            setError({ status: true, message: error.message });
        } finally {
            setLoading(SET_LOADING_STATUS_FALSE);
        }
    }

    const cleanDeleteDialogInfo = () => {
        setDeleteId(null);
        setDeleteMessage(null);
        setConfirmDelete(false);
        setOpenDeleteDialog(false);
    }

    const onViewClick = (_: React.MouseEvent, row: any) => {
        setLoading({ status: true, message: null });
        navigate(`/lecturer/user-management/student/${row._id}`);
    };

    const columns: GridColDef[] = [
        { field: 'no', headerName: 'No', width: 50, flex: undefined },
        { field: 'name', headerName: 'Student Name', width: undefined, flex: 1 },
        { field: 'email', headerName: 'Email', width: undefined, flex: 1 },
        { field: 'batch', headerName: 'Batch', width: undefined, flex: 1 },
        { field: 'group', headerName: 'Group', width: undefined, flex: 1 },
        {
            field: 'action',
            headerName: 'Action',
            width: undefined,
            flex: 1,
            headerAlign: 'center',
            renderCell: (params) => {
                return (
                    <div className='flex justify-around items-center'>
                        <IconButton sx={{ backgroundColor: 'lightgray' }} onClick={(e) => onViewClick(e, params.row)}>
                            <PageviewIcon />
                        </IconButton>
                        <IconButton aria-label="delete" sx={{
                            color: 'inherit',
                            '&:hover': {
                                color: 'red',
                            },
                        }} onClick={(e) => onDeleteButtonClick(e, params.row)}>
                            <DeleteIcon />
                        </IconButton>
                    </div>
                );
            }
        }
    ];



    const handleBulkImportButtonClick = () => {
        navigate(`/lecturer/user-management/batch/${batchId}/student/bulkImport`);
    };

    const handleAddStudentManuallyButtonClick = () => {
        navigate(`/lecturer/user-management/batch/${batchId}/student/addStudent`);
    }

    return (
        <ContentPanel
            title={"Student Management / Batch / " + batchName}
            hasBackButton={true}
            backLink={-1}
            content={
                <div className="flex flex-col">
                    <div
                        className="flex flex-row justify-between mb-3"
                    >
                        <div
                            className="flex flex-row gap-2"
                        >
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<DescriptionIcon />}
                                sx={{ borderRadius: 100, paddingX: 4, height: '40px' }}
                                onClick={handleBulkImportButtonClick}
                            >
                                Bulk Import
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<AddBoxOutlinedIcon />}
                                sx={{ borderRadius: 100, paddingX: 4, height: '40px' }}
                                onClick={handleAddStudentManuallyButtonClick}
                            >
                                Add Student
                            </Button>
                        </div>
                        <div
                            className="flex flex-row gap-2 items-center"
                        >
                            <p>Mark Visible To Student</p>
                            <Switch
                                checked={VisibleMarkChecked}
                                onChange={handleToggleVisibleMarkChanged}
                            />
                        </div>
                    </div>
                    <Paper sx={{ height: 400, width: 'auto' }}>
                        <DataGrid
                            rows={rows}
                            columns={columns}
                            initialState={{
                                pagination: {
                                    paginationModel: {
                                        pageSize: 10,
                                    }
                                }
                            }}
                            pageSizeOptions={[10, 25, 50, 100]}
                            disableColumnResize={true}
                            autosizeOnMount={true}
                            getRowId={(row) => row._id!}
                            autosizeOptions={
                                {
                                    expand: true,
                                    includeHeaders: true,
                                }
                            }
                        />
                    </Paper>
                    <ConfirmDeleteDialog open={openDeleteDialog} setOpen={setOpenDeleteDialog} deleteData={deleteMessage} setDeleteData={setDeleteMessage} handleDelete={handleDelete} handleCloseCall={cleanDeleteDialogInfo} />
                    <ConfirmationPopup open={openToggleDialog} content={toggleDialogContent} onClose={onCloseToggleDialog} onConfirm={onConfirmToggleVisibleMark} />
                </div>
            }
        />
    );
};

export default StudentManagement;