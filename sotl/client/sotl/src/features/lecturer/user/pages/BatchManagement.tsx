import ContentPanel from "../../../../components/ContentPanel";
import { GridColDef, DataGrid } from '@mui/x-data-grid';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import PageviewIcon from '@mui/icons-material/Pageview';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Refresh } from '@mui/icons-material';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ConfirmDeleteDialog from '../../../../components/ConfirmDeleteDialog';
import { batchStudentHooks } from '../hooks/batchStudentHooks';
import { useBatchStudent, SET_LOADING_STATUS_FALSE } from '../contexts/BatchStudentContext';
import moment from 'moment';
import { LoadingPopupProps } from '../../../../components/LoadingPopup';
import { BatchStudent } from '../models';
import { useFeedbackDialog } from "../../../../context/FeedbackDialog";

const BatchManagement: React.FC = () => {
    const [open, setOpen] = useState<boolean>(false);
    const [deleteData, setDeleteData] = useState<any>(null);
    const [deleteItem, setDeleteItem] = useState<string | null>(null);
    const navigate = useNavigate();
    const { batchStudent, setError, setLoading, setSuccess, batchStudentDispatch } = useBatchStudent();
    const { removeCategory, getAllBatchStudents } = batchStudentHooks();
    const [rows, setRows] = useState<any[]>([]);
    const [batchManagementLoading, setBatchManagementLoading] = useState<boolean>(true);
    const { setLoadingPane } = useFeedbackDialog();

    const loadingPopupProps: LoadingPopupProps = {
        open: batchManagementLoading,
    };

    const refreshBatchStudent = async () => {
        try {
            let result = await getAllBatchStudents();
            batchStudentDispatch({ type: 'INIT', payload: result });
        } catch (e: any) {
            setError({ status: true, message: e.message });
        } finally {
            setLoading(SET_LOADING_STATUS_FALSE);
        }
    };

    const fetchData = () => {
        setLoading({ status: true, message: null });
        try {
            const data = batchStudent.map((item: any, index: number) => {
                return {
                    _id: item._id,
                    no: index + 1,
                    batch: item.batch,
                    studentNumber: item.belonged.length,
                    createdAt: item.createdAt
                }
            });
            setRows(data);
            setLoading(SET_LOADING_STATUS_FALSE);
        } catch (error: any) {
            setError({ status: true, message: error.message });
        } finally {
            setBatchManagementLoading(false);
            setLoadingPane({status: false, message: null});
        }
    }

    useEffect(() => {
        fetchData();
    }, [batchStudent]);

    const onViewClick = (_: React.MouseEvent, row: any) => {
        setLoading({ status: true, message: null });
        navigate(`/lecturer/user-management/batch/${row._id}/student`);
    };

    const onEditButtonClick = (_: React.MouseEvent, row: any) => {
        navigate(`/lecturer/user-management/batch/${row._id}/edit`);
    };

    const onDeleteButtonClick = (_: React.MouseEvent, row: any) => {
        setDeleteItem(row._id)
        setDeleteData(row.batch);
        setOpen(true);
    }

    const handleDelete = async () => {
        try {
            const hadStudent = batchStudent.find((item: BatchStudent) => item._id === deleteItem)?.belonged.length > 0;
            if (deleteItem === null) {
                throw new Error('Delete item is null');
            } else if (hadStudent) {
                throw new Error('Cannot delete batch with students');

            }
            const result = await removeCategory(deleteItem);
            if (result) {
                batchStudentDispatch({
                    type: 'DELETE_BATCH', payload: {
                        batch: {
                            _id: deleteItem
                        }
                    }
                });
                setSuccess({ status: true, message: 'Batch deleted successfully' });
            }
        } catch (error: any) {
            console.log(error);
            setError({ status: true, message: error.message });
        } finally {
            setDeleteItem(null);
            setDeleteData(null);
            setOpen(false);
        }
    }

    const columns: GridColDef[] = [
        { field: 'no', headerName: 'No', width: 50, flex: undefined },
        { field: 'batch', headerName: 'Batch', width: undefined, flex: 1 },
        { field: 'studentNumber', headerName: 'Student Number', width: undefined, flex: 1 },
        { field: 'createdAt', headerName: 'Create Date', width: undefined, flex: 1, valueGetter: (_, row) => moment(row.createdAt).format('DD/MM/YYYY') },
        {
            field: 'action',
            headerName: 'Action',
            width: undefined,
            flex: 1,
            headerAlign: 'center',
            renderCell: (params) => {
                return (
                    <div className='flex justify-around items-center' style={{ height: '100%' }}>
                        <IconButton sx={{ backgroundColor: 'lightgray' }} onClick={(e) => onViewClick(e, params.row)}>
                            <PageviewIcon />
                        </IconButton>
                        <IconButton sx={{ backgroundColor: 'lightgray' }} onClick={(e) => onEditButtonClick(e, params.row)}>
                            <EditIcon />
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

    const handleButtonClick = () => {
        navigate('/lecturer/user-management/batch/addBatch');
    };

    return (
        <>
            <ContentPanel
                title="Student Management / Batch"
                loadingPopup={loadingPopupProps}
                customActions={
                    <IconButton sx={{ backgroundColor: 'lightgray' }} onClick={() => refreshBatchStudent()}><Refresh /></IconButton>
                }
                content={
                    <div className="flex flex-col">
                        <div
                            className="flex justify-start mb-3"
                        >
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<AddBoxOutlinedIcon />}
                                sx={{ borderRadius: 100, paddingX: 4 }}
                                onClick={handleButtonClick}
                            >
                                Add Batch
                            </Button>
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
                        <ConfirmDeleteDialog open={open} setOpen={setOpen} deleteData={deleteData} setDeleteData={setDeleteData} handleDelete={handleDelete} />
                    </div>
                }
            />
        </>
    );
};

export default BatchManagement;