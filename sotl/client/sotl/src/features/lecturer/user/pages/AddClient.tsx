import ContentPanel from "../../../../components/ContentPanel";
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { FormControl, FormHelperText, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import Box from '@mui/material/Box';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { batchStudentHooks } from '../hooks/batchStudentHooks';
import { useBatchStudent, SET_LOADING_STATUS_FALSE } from '../contexts/BatchStudentContext';
import { GroupProject } from '../models';
import * as Validator from '../../../../utils/validator';
import { AddStudentWithPasswordPayload } from '../models';
import { set } from "lodash";

const AddClient: React.FC = () => {
    const [name, setName] = useState<string>('');
    const [designation, setDesignation] = useState<string>('');
    const [company, setCompany] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [batch, setBatch] = useState<string>('');
    const [projectSelected, setProjectSelected] = useState<string>('');
    const [batchList, setBatchList] = useState<any[]>([]);
    const [projectList, setProjectList] = useState<any[]>([]);
    const [groupProjcts, setGroupProjects] = useState<GroupProject[]>([]);
    const [canCreate, setCanCreate] = useState<boolean>(false);
    const navigate = useNavigate();
    const { getGroupProjectList, addClient } = batchStudentHooks();
    const { setError, setLoading, setSuccess } = useBatchStudent();

    const fetchData = async () => {
        try {
            const result = await getGroupProjectList();
            setGroupProjects(result);
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

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if(name.trim().length === 0 || designation.trim().length === 0 || company.trim().length === 0 || email.trim().length === 0 || batch === '' || projectSelected === '') {
            setCanCreate(false);
        }

        if(name.trim().length > 0 && designation.trim().length > 0 && company.trim().length > 0 && email.trim().length > 0 && batch !== '' && projectSelected !== '') {
            setCanCreate(true);
        }
    }, [company, designation, email, name, batch, projectSelected]);

    const handleCreate = async () => {
        try {
            setLoading({ status: true, message: null });
            const result = await addClient({
                email: email,
                name: name,
                company: company,
                designation: designation,
                batch: batch,
                projectId: projectSelected
            });
            if (result) {
                setSuccess({ status: true, message: 'Cliend created successfully' });
                navigate(-1);
            }
        } catch (error: any) {
            console.log(error);
            setError({ status: true, message: error.message });
        } finally {
            setLoading(SET_LOADING_STATUS_FALSE);
        }
    };

    const handleBatchChange = (event: SelectChangeEvent) => {
        setBatch(event.target.value as string);
        const projects = groupProjcts.filter((item: GroupProject) => item.batch === event.target.value && item.project._id != undefined);
        setProjectList(projects);
        setProjectSelected('');
    };

    const handleProjectChange = (event: SelectChangeEvent) => {
        setProjectSelected(event.target.value as string);
    };
    
    return (
        <ContentPanel
            title="Add Client"
            titleIcon={<AddBoxOutlinedIcon fontSize="large" />}
            hasBackButton={true}
            backLink={-1}
            borderShadowSize={2}
            content={
                <Box className="flex flex-col justify-start gap-4" style={{ height: 'auto' }} >
                    <div
                        className="flex flex-row justify-between gap-4"
                    >
                        <FormControl required sx={{ minWidth: 120 }} className="flex-1">
                            <TextField
                                required
                                id="outlined-required"
                                label="Name"
                                placeholder="Enter Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                            <FormHelperText>Required</FormHelperText>
                        </FormControl>
                        <FormControl required sx={{ minWidth: 120 }} className="flex-1">
                            <TextField
                                required
                                id="outlined-required"
                                label="Email"
                                placeholder="Enter Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <FormHelperText>Required</FormHelperText>
                        </FormControl>
                    </div>
                    <div
                        className="flex flex-row justify-between gap-4"
                    >
                        <FormControl required sx={{ minWidth: 120 }} className="flex-1">
                            <TextField
                                required
                                id="outlined-required"
                                label="Company"
                                placeholder="Enter Company Name"
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
                            />
                            <FormHelperText>Required</FormHelperText>
                        </FormControl>
                        <FormControl required sx={{ minWidth: 120 }} className="flex-1">
                            <TextField
                                required
                                id="outlined-required"
                                label="Designation"
                                placeholder="Enter Designation"
                                value={designation}
                                onChange={(e) => setDesignation(e.target.value)}
                            />
                            <FormHelperText>Required</FormHelperText>
                        </FormControl>
                    </div>
                    <div
                        className="flex flex-row justify-between gap-4"
                    >
                        <FormControl required sx={{ minWidth: 120 }} className="flex-1">
                            <InputLabel id="demo-simple-select-required-label">Batch</InputLabel>
                            <Select
                                labelId="demo-simple-select-required-label"
                                id="demo-simple-select-required"
                                value={batch}
                                label="Batch *"
                                onChange={handleBatchChange}
                            >
                                <MenuItem value="">
                                    <em>None</em>
                                </MenuItem>
                                {
                                    batchList.map((item: any, index: number) => {
                                        return <MenuItem value={item} key={index}>{item}</MenuItem>
                                    })
                                }
                            </Select>
                            <FormHelperText>Required</FormHelperText>
                        </FormControl>
                        <FormControl required sx={{ minWidth: 120 }} className="flex-1">
                            <InputLabel id="demo-simple-select-required-label">Project</InputLabel>
                            <Select
                                labelId="select-required"
                                id="select-required"
                                value={projectSelected}
                                label="Project *"
                                onChange={handleProjectChange}
                            >
                                <MenuItem value="">
                                    <em>None</em>
                                </MenuItem>
                                {
                                    projectList.map((item: any, index: number) => {
                                        return <MenuItem value={item.project._id} className="break-words" key={index}>{item.project.title}</MenuItem>
                                    })
                                }
                            </Select>
                            <FormHelperText className="flex flex-row justify-between"><span>Required</span><span>{projectSelected!== ''?projectList.find(i => i.project._id === projectSelected)?.name:'' }</span></FormHelperText>
                        </FormControl>
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

export default AddClient;