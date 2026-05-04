import ContentPanel from "../../../../components/ContentPanel";
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { batchStudentHooks } from '../hooks/batchStudentHooks';
import { useBatchStudent } from '../contexts/BatchStudentContext';
import { BatchStudent } from '../models';

const AddStudent: React.FC = () => {
    const { batchId } = useParams();
    const [email, setEmail] = useState<string>('');
    const [matric, setMatric] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [canCreate, setCanCreate] = useState<boolean>(false);
    const navigate = useNavigate();
    const { addStudentManually } = batchStudentHooks();
    const { batchStudent, setError, setLoading, setSuccess, batchStudentDispatch } = useBatchStudent();

    const handleCreate = async () => {
        setEmail(email.trim());
        setMatric(matric.trim());
        setPassword(password.trim());
        try {
            const batchData = batchStudent.find((item: BatchStudent) => item._id === batchId);
            const batchName = batchData?.batch;
            setLoading({ status: true, message: null });
            const result = await addStudentManually({
                email: email,
                matric: matric,
                password: password,
                batch: batchName
             });
            if (result) {
                batchStudentDispatch({ type: 'ADD_STUDENT', payload: {
                    batch: {
                        _id: batchId,
                        name: batchName
                    },
                    student: result
                } });
                setSuccess({ status: true, message: 'Student created successfully' });
                navigate(-1);
            }
        } catch (error: any) {
            console.log(error);
            setError({ status: true, message: error.message });
        }
    }

    useEffect(() => {
        if (email.trim().length === 0 || matric.trim().length === 0 || password.trim().length === 0) {
            setCanCreate(false);
        }

        if (email.trim().length > 0 && matric.trim().length > 0 && password.trim().length > 7) {
            setCanCreate(true);
        }
    }, [email, matric, password]);


    return (
        <ContentPanel
            title="Add Student"
            titleIcon={<AddBoxOutlinedIcon fontSize="large" />}
            hasBackButton={true}
            backLink={-1}
            borderShadowSize={2}
            content={
                <Box className="flex flex-col justify-start gap-4" style={{ height: 'auto' }} >
                    <TextField
                        required
                        id="outlined-required"
                        label="Email"
                        placeholder="Enter Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <div
                        className="flex flex-row justify-between gap-4"
                    >
                        <TextField
                            required
                            id="outlined-required"
                            label="Matric"
                            placeholder="Enter Matric Number"
                            value={matric}
                            onChange={(e) => setMatric(e.target.value)}
                            sx={{ width: '100%' }}
                        />
                        <TextField
                            required
                            id="outlined-required"
                            label="Password"
                            placeholder="Enter Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            sx={{ width: '100%' }}
                        />
                    </div>
                    <div
                        className="text-left text-xs text-red-500"
                    >
                        *** Password must be at least 8 characters long<br/>
                        *** Do not contain space character in email, matric and password
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
    );
};

export default AddStudent;