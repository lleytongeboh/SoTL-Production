import ContentPanel from "../../../../components/ContentPanel";
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { batchStudentHooks } from '../hooks/batchStudentHooks';
import { useBatchStudent } from '../contexts/BatchStudentContext';
import { BatchStudent } from '../models';

const AddBatch: React.FC = () => {
    const [batchName, setBatchName] = useState<string>('');
    const [canCreate, setCanCreate] = useState<boolean>(false);
    const navigate = useNavigate();
    const { addBatchCategory } = batchStudentHooks();
    const { batchStudent, setError, setLoading, batchStudentDispatch, setSuccess } = useBatchStudent();

    const handleCreate = async () => {
        setBatchName(batchName.trim());
        try {
            const allBatchName = batchStudent.map((item: BatchStudent) => item.batch);
            if (allBatchName.includes(batchName)) {
                throw new Error('Batch name is already existed');
            }
            setLoading({ status: true, message: null });
            const batchCategoryCreated = await addBatchCategory(batchName);
            if (batchCategoryCreated) {
                batchStudentDispatch({ type: 'ADD_BATCH', payload: { BatchStudent: batchCategoryCreated } });
                setSuccess({ status: true, message: 'Batch created successfully' });
                navigate(-1);
            }
        } catch (error: any) {
            console.log(error);
            setError({ status: true, message: error.message });
        }
    }

    useEffect(() => {
        if (batchName.trim().length === 0) {
            setCanCreate(false);
        }

        if (batchName.trim().length > 0) {
            setCanCreate(true);
        }
    }, [batchName]);


    return (
        <ContentPanel
            title="Add Batch"
            titleIcon={<AddBoxOutlinedIcon fontSize="large" />}
            hasBackButton={true}
            backLink={-1}
            borderShadowSize={2}
            content={
                <Box className="flex flex-col justify-between" style={{ height: '150px' }} >
                    <TextField
                        required
                        id="outlined-required"
                        label="Batch Name"
                        placeholder="Enter batch"
                        value={batchName}
                        onChange={(e) => setBatchName(e.target.value)}
                    />
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
    );
};

export default AddBatch;