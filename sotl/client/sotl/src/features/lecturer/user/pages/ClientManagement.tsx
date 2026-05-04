import ContentPanel from "../../../../components/ContentPanel";
import { GridColDef, DataGrid } from '@mui/x-data-grid';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Refresh } from '@mui/icons-material';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ConfirmDeleteDialog from '../../../../components/ConfirmDeleteDialog';
import { batchStudentHooks } from '../hooks/batchStudentHooks';
import { useBatchStudent, SET_LOADING_STATUS_FALSE } from '../contexts/BatchStudentContext';
import { LoadingPopupProps } from '../../../../components/LoadingPopup';
import { ClientStateProps, ClientProps } from '../models';

const ClientManagement: React.FC = () => {
    const [open, setOpen] = useState<boolean>(false);
    const [deleteData, setDeleteData] = useState<any>(null);
    const [deleteItem, setDeleteItem] = useState<string | null>(null);
    const navigate = useNavigate();
    const { setError, setLoading, setSuccess } = useBatchStudent();
    const { getClientList, removeClient, hookLoading } = batchStudentHooks();
    const [rows, setRows] = useState<ClientStateProps[]>([]);

    const loadingPopupProps: LoadingPopupProps = {
        open: hookLoading,
    };

    const refreshBatchStudent = async () => {
        try {
            let result = await getClientList();
            
            setRows(result.map((item: ClientProps, index: number) => {
                return {
                    ...item,
                    no: index + 1
                }
            }));
            setSuccess({ status: true, message: 'Client list refreshed' });
        } catch (e: any) {
            setError({ status: true, message: e.message });
        } finally {
            setLoading(SET_LOADING_STATUS_FALSE);
        }
    };

    const fetchData = async () => {
        setLoading({ status: true, message: null });
        try {
            let result = await getClientList();
            setRows(result.map((item: ClientProps, index: number) => {
                return {
                    ...item,
                    no: index + 1
                }
            }));
        } catch (error: any) {
            console.log(error);
            setError({ status: true, message: error.message });
        } finally {
            setLoading(SET_LOADING_STATUS_FALSE);
        }
    }

    useEffect(() => {
        fetchData();
    }, []);


    const onEditButtonClick = (_: React.MouseEvent, row: any) => {
        setLoading({ status: true, message: null });
        navigate(`/lecturer/user-management/client/${row._id}`);
    };

    const onDeleteButtonClick = (_: React.MouseEvent, row: any) => {
        setDeleteItem(row._id)
        setDeleteData(`Do you want to delete this client ${row.name}?`);
        setOpen(true);
    }

    const handleDelete = async () => {
        try {
            if (deleteItem === null) {
                throw new Error('Delete item is null');
            }
            const result = await removeClient(deleteItem);
            if (result) {
                setRows((prev) => prev.filter((item) => item._id !== deleteItem));
                setSuccess({ status: true, message: 'Client deleted successfully' });
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
        { field: 'client', headerName: 'Client', width: undefined, flex: 1 , valueGetter: (_, row) => row.name},
        { field: 'email', headerName: 'Email', width: undefined, flex: 1 },
        { field: 'groupName', headerName: 'Group', width: undefined, flex: 1, valueGetter: (_, row) => row.groupName !== undefined ? row.groupName : '-' },
        { field: 'project', headerName: 'Project', width: undefined, flex: 1, valueGetter: (_, row) => row.project.title },
        {
            field: 'action',
            headerName: 'Action',
            width: undefined,
            flex: 1,
            headerAlign: 'center',
            renderCell: (params) => {
                return (
                    <div className='flex justify-around items-center' style={{ height: '100%' }}>
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
        setLoading({ status: true, message: null });
        navigate('/lecturer/user-management/client/add');
    };

    return (
        <>
            <ContentPanel
                title="Client Management"
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
                                Add Client
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

export default ClientManagement;