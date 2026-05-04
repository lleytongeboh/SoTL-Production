import ContentPanel from "../../../../components/ContentPanel";
import EditIcon from '@mui/icons-material/Edit';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { batchStudentHooks } from '../hooks/batchStudentHooks';
import { useBatchStudent, SET_LOADING_STATUS_FALSE } from '../contexts/BatchStudentContext';
import { BatchStudent } from '../models';
import { useNavigate } from 'react-router-dom';
import AlertDialog from '../../../../components/ConfirmDeleteDialog'

const EditBatch: React.FC = () => {
    let { batchId } = useParams();
    const [originalBatch, setOriginalBatch] = useState('');
    const [batch, setBatch] = useState('');
    const [canSave, setCanSave] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [deleteData, setDeleteData] = useState<string | null>(null);
    const navigate = useNavigate();
    const { batchStudent, setLoading, setError, setSuccess, batchStudentDispatch } = useBatchStudent();
    const [isOnDeleting, setIsOnDeleting] = useState(false);

    const { editCategoryName, removeCategory } = batchStudentHooks();

    const fetchData = async () => {
        try {
            let result = batchStudent.find((item: BatchStudent) => item._id === batchId);
            if (result === undefined || result?.batch === undefined) {
                throw new Error('Batch not found');
            }
            setOriginalBatch(result?.batch);
            setBatch(result?.batch);
        } catch (e: any) {
            setError({ status: true, message: e.message });
        } finally {
            setLoading(SET_LOADING_STATUS_FALSE);
        }
    }

    useEffect(() => {
        if(!isOnDeleting){
            fetchData();
        }
    }, [batchStudent]);

    useEffect(() => {
        if (originalBatch === batch.trim() || batch.trim().length === 0) {
            setCanSave(false);
        }

        if (originalBatch !== batch.trim() && batch.length > 0) {
            setCanSave(true);
        }
    }, [batch]);

    const handleSave = async () => {
        try {
            if (batchId === undefined || batchId === null) {
                throw new Error('Batch Id is not found');
            }
            setLoading({ status: true, message: 'Saving...' });
            setBatch(batch.trim());
            const result = await editCategoryName(batchId, batch);
            if (result) {
                batchStudentDispatch({
                    type: 'EDIT_BATCH', payload: {
                        batch: {
                            _id: batchId,
                            name: batch
                        }
                    }
                });
                setSuccess({ status: true, message: 'Batch saved successfully' });
                navigate(-1);
            }
        } catch (error: any) {
            setError({ status: true, message: error.message || 'Failed to save batch' });
        }
    };

    const handleDelete = async () => {
        try {
            const hadStudent = batchStudent.find((item: BatchStudent) => item._id === batchId)?.belonged.length > 0;
            if (batchId === undefined || batchId === null) {
                throw new Error('Batch Id is not found');
            } else if (hadStudent) {
                throw new Error('Cannot delete batch with students');
                
            }
            setLoading({ status: true, message: 'Deleting...' });
            setIsOnDeleting(true);
            const result = await removeCategory(batchId);
            if (result) {
                batchStudentDispatch({
                    type: 'DELETE_BATCH', payload: {
                        batch: {
                            _id: batchId
                        }
                    }
                });
                setSuccess({ status: true, message: 'Batch deleted successfully' });
                navigate(-1);
            }
        } catch (err: any) {
            setError({ status: true, message: err.message || 'Failed to delete batch' });
        }
    };

    const onClickDeleteBtn = () => {
        setDeleteData(batch);
        setOpenDeleteDialog(true);
    }

    return (
        <ContentPanel
            title="Edit Batch"
            titleIcon={<EditIcon fontSize="large" />}
            hasBackButton={true}
            backLink={-1}
            borderShadowSize={2}
            content={
                <>
                    <Box className="flex flex-col justify-between" style={{ height: 'auto' }} >
                        <TextField
                            required
                            id="outlined-required"
                            label="Batch Name"
                            placeholder="Enter batch"
                            value={batch}
                            onChange={(e) => setBatch(e.target.value)}
                        />
                        <div
                            className="flex flex-row justify-between"
                        >
                            <Button
                                variant="contained"
                                color="error"
                                sx={{ paddingX: 4 }}
                                onClick={onClickDeleteBtn}
                            >
                                DELETE
                            </Button>
                            <Button
                                variant="contained"
                                color="success"
                                sx={{ paddingX: 4 }}
                                disabled={!canSave}
                                onClick={handleSave}
                            >
                                SAVE
                            </Button>
                        </div>
                    </Box>
                    <AlertDialog open={openDeleteDialog} setOpen={setOpenDeleteDialog} deleteData={deleteData} setDeleteData={setDeleteData} handleDelete = {handleDelete} />
                </>
            }
        />
    );
};

export default EditBatch;