import ContentPanel from "../../../../components/ContentPanel";
import StudentLogDialog from "../components/StudentLogDialog";
import ConfirmDeleteDialog from '../../../../components/ConfirmDeleteDialog';
import { Button, Box, FormControl, FormHelperText, IconButton, TextField } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { batchStudentHooks } from '../hooks/batchStudentHooks';
import { useBatchStudent, SET_LOADING_STATUS_FALSE } from '../contexts/BatchStudentContext';
import { BatchStudent, StudentLogProps, ExtendedStudentLogProps } from '../models';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { ClearOutlined, History, Refresh, Pageview, Delete } from '@mui/icons-material';
import { GridColDef, DataGrid } from '@mui/x-data-grid';
import * as XLSX from 'xlsx';  // Import SheetJS library
import moment from 'moment';

type BulkImportStudentProps = {
    no: number;
    email: string;
    matric: string;
    batch: string;
};

const BulkImportStudent: React.FC = () => {
    const { batchId } = useParams();
    const [batchName, setBatchName] = useState<string>('');
    const [canCreate, setCanCreate] = useState<boolean>(false);
    const { addStudentsBulk, fetchStudentLogData, removeStudentLogData } = batchStudentHooks();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const { batchStudent, setError, setLoading, setSuccess } = useBatchStudent();
    const [rows, setRows] = useState<BulkImportStudentProps[]>([]);
    const [logRows, setLogRows] = useState<StudentLogProps[]>([]);
    const [openLogDialog, setOpenLogDialog] = useState<boolean>(false);
    const [studentLog, setStudentLog] = useState<ExtendedStudentLogProps | null>(null);
    const [deleteData, setDeleteData] = useState<string | null>(null);
    const [deleteItem, setDeleteItem] = useState<string | null>(null);
    const [openDeleteConfirmDialog, setOpenDeleteConfirmDialog] = useState<boolean>(false);

    useEffect(() => {
        if (batchStudent.length > 0) {
            const batchData = batchStudent.find((item: BatchStudent) => item._id === batchId);
            setBatchName(batchData?.batch!);
        }
    }, []);

    useEffect(() => {
        if (rows.length === 0) {
            setCanCreate(false);
        }
        if (rows.length > 0) {
            setCanCreate(true);
        }
    }, [rows]);

    const onFileClear = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setRows([]);  // Clear the rows when the file is cleared
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const maxSize = 20 * 1024 * 1024; // 20MB
        const file = event.target.files?.[0];

        if (file) {
            try {
                const validExtensions = ['.xlsx'];
                const mimeTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

                // Check file size
                if (file.size > maxSize) {
                    throw new Error('File size must be less than 20MB');
                }

                // Check file extension and MIME type
                const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
                if (!validExtensions.includes(extension) || !mimeTypes.includes(file.type)) {
                    throw new Error('Invalid file format. Please upload a valid XLSX file.');
                }

                // Read file as ArrayBuffer
                const data = await file.arrayBuffer();
                const workbook = XLSX.read(data, { type: 'array' });

                // Parse the first sheet into JSON
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                const jsonData: BulkImportStudentProps[] = XLSX.utils.sheet_to_json(worksheet, {
                    header: ['email', 'matric'],
                    defval: '',
                }).map((row: any, index: number) => ({
                    no: index + 1,
                    email: String(row.email).trim(),
                    matric: String(row.matric).trim(),
                    batch: batchName
                }));

                console.log('Parsed Data:', jsonData);
                setRows(jsonData); // Update DataGrid rows
                setCanCreate(true); // Enable Create button

            } catch (error: any) {
                console.error('Error:', error);
                setError({ status: true, message: error.message }); // Display error message to the user
                fileInputRef.current!.value = ''; // Clear file input
            }
        }
    };

    const handleCreate = async () => {
        try {
            setLoading({ status: true, message: 'Create Students...' });
            const result = await addStudentsBulk(rows);
            if (result) {
                setRows([]);
                setSuccess({ status: true, message: 'Students is Added Successfully And Processing Now' });
            }
        } catch (error: any) {
            console.log(error);
            setError({ status: true, message: error.message });
        } finally {
            setLoading(SET_LOADING_STATUS_FALSE);
        }
    }

    const columns: GridColDef[] = [
        { field: 'no', headerName: 'No', width: 50, flex: undefined },
        { field: 'email', headerName: 'Email', width: undefined, flex: 1 },
        { field: 'matric', headerName: 'Matric Number', width: undefined, flex: 1 },
        { field: 'batch', headerName: 'Batch', width: undefined, flex: 1 }
    ];

    // Student logs
    const logColumns: GridColDef[] = [
        { field: 'no', headerName: 'No', width: 50, flex: undefined },
        { field: 'jobContent', headerName: 'Task Content', width: undefined, flex: 1 },
        { field: 'status', headerName: 'Status', width: undefined, flex: 1 },
        { field: 'createdAt', headerName: 'Created At', width: undefined, flex: 1, valueGetter: (_, row) => moment(row.createdAt).format('DD/MM/YYYY h:mm:ss') },
        { field: 'updatedAt', headerName: 'Updated At', width: undefined, flex: 1, valueGetter: (_, row) => moment(row.updatedAt).format('DD/MM/YYYY h:mm:ss') },
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
                            <Pageview />
                        </IconButton>
                        <IconButton aria-label="delete" sx={{
                            color: 'inherit',
                            '&:hover': {
                                color: 'red',
                            },
                        }} onClick={(e) => onDeleteButtonClick(e, params.row)}>
                            <Delete />
                        </IconButton>
                    </div>
                );
            }
        }
    ];

    useEffect(() => {
        fetchLogData();
    }, []);

    const fetchLogData = async () => {
        try {
            if (batchId === undefined || batchId === null) {
                throw new Error('Batch ID is not valid');
            }
            setLoading({ status: true, message: 'Catch Student Log...' });
            const data = await fetchStudentLogData(batchId);

            setLogRows(data.map((d, index) => ({ ...d, no: index + 1 })));
        } catch (error: any) {
            setError({ status: true, message: error.message });
        } finally {
            setLoading(SET_LOADING_STATUS_FALSE);
        }
    };

    const onCloseStudentLogDialog = () => {
        setOpenLogDialog(false);
        setStudentLog(null);
    }

    const onViewClick = (_: React.MouseEvent<HTMLButtonElement>, row: any) => {
        console.log('row', row);
        setStudentLog(row);
        setOpenLogDialog(true);
    };

    const onDeleteButtonClick = (_: React.MouseEvent<HTMLButtonElement>, row: any) => {
        setDeleteItem(row._id);
        setDeleteData(`Are you sure you want to delete the task with ID ${row.jobId}?`);
        setOpenDeleteConfirmDialog(true);
    };

    const handleDelete = async () => {
        try {
            if(deleteItem === null) {
                throw new Error('Delete item is null');
            }
            const result = await removeStudentLogData(deleteItem!);
            if (result) {
                setSuccess({ status: true, message: 'Task Deleted Successfully' });
                setLogRows(logRows.filter((row) => row._id !== deleteItem));
            }
        } catch (error: any) {
            setError({ status: true, message: error.message });
        } finally {
            setLoading(SET_LOADING_STATUS_FALSE);
            setOpenDeleteConfirmDialog(false);
        }
    }

    return (
        <>
            <div
                className="flex flex-col gap-6"
            >
                <ContentPanel
                    title="Bulk Import Student"
                    titleIcon={<UploadFileIcon fontSize="large" />}
                    hasBackButton={true}
                    backLink={-1}
                    borderShadowSize={2}
                    content={
                        <Box className="flex flex-col justify-start gap-4" style={{ height: 'auto' }} >
                            <FormControl fullWidth>
                                <TextField
                                    type='file'
                                    label='Project Proposal File'
                                    inputRef={fileInputRef}
                                    onChange={handleFileUpload}
                                    InputProps={
                                        {
                                            endAdornment: <IconButton
                                                onClick={onFileClear}
                                                sx={{
                                                    '&:focus:not(:focus-visible)': {
                                                        outline: 'none',
                                                    },
                                                }}><ClearOutlined /></IconButton>,
                                        }
                                    }
                                    InputLabelProps={{ shrink: true }}
                                >
                                </TextField>
                                <FormHelperText>{"*File Must Be In .xlsx And Size <= 20MB"}</FormHelperText>
                                <br />
                            </FormControl>
                            <div>
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
                                    getRowId={(row) => row.no!}
                                    autosizeOptions={
                                        {
                                            expand: true,
                                            includeHeaders: true,
                                        }
                                    }
                                />
                            </div>
                            <div
                                className="flex flex-row justify-center"
                            >
                                <Button
                                    variant="contained"
                                    color="success"
                                    onClick={handleCreate}
                                    disabled={!canCreate}
                                >
                                    Create
                                </Button>
                            </div>
                        </Box>
                    }
                />
                <ContentPanel
                    title="Bulk Import Student Log"
                    titleIcon={<History fontSize="large" />}
                    borderShadowSize={2}
                    customActions={
                        <IconButton sx={{ backgroundColor: 'lightgray' }} onClick={() => fetchLogData()}><Refresh /></IconButton>
                    }
                    content={
                        <Box className="flex flex-col justify-start gap-4" style={{ height: 'auto', width: 'auto' }} >
                            <div>
                                <DataGrid
                                sx={{ width: 'auto' }}
                                    rows={logRows}
                                    columns={logColumns}
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
                            </div>
                            <StudentLogDialog open={openLogDialog} onClose={onCloseStudentLogDialog} studentLog={studentLog} />
                            <ConfirmDeleteDialog open={openDeleteConfirmDialog} setOpen={setOpenDeleteConfirmDialog} deleteData={deleteData} setDeleteData={setDeleteData} handleDelete={handleDelete} />
                        </Box>
                    }
                />
            </div>
        </>

    );
};

export default BulkImportStudent;