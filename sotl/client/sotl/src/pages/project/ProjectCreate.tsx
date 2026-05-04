import { AddBoxOutlined } from "@mui/icons-material";
import ContentPanel from "../../components/ContentPanel";
import { Button, FormControl, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { Project } from "src/features/student/project/models";
import SuccessPopup from "../../components/SuccessPopup";
import { useNavigate } from "react-router-dom";
import { projectHooks } from "../../features/student/project/hooks/projectHooks";
import ErrorPopup from "../../components/ErrorPopup";
import { useProject } from "../../features/student/project/context/ProjectContext";
import { Group } from "../../features/student/group/models";
import { useGroup } from "../../features/student/group/context/GroupContext";

const ProjectProposalCreate: React.FC = () => {
    const [title, setTitle] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [validCreate, setValidCreate] = useState<boolean>(false);
    const [successPopup, setSuccessPopup] = useState(false);
    const [errorPopup, setErrorPopup] = useState(false);

    const { selectedGroup, setSelectedGroup }: { selectedGroup: Group, setSelectedGroup: React.Dispatch<React.SetStateAction<Group | null>> } = useGroup();
    const { createProject, error, loading } = projectHooks();
    const { selectedProject, setSelectedProject }: { selectedProject: Project, setSelectedProject: React.Dispatch<React.SetStateAction<Project | null>> } = useProject();
    const navigate = useNavigate();

    const onTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(event.target.value);
    }

    const onDescriptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setDescription(event.target.value);
    }

    const validateCreate = () => {
        if (title && description) {
            setValidCreate(true);
        } else {
            setValidCreate(false);
        }
    }

    const onCreateProject = async () => {
        try {
            const project: Project = {
                title,
                description,
            };
            const response: Project = await createProject(project, selectedGroup._id!);
            if (response) {
                setSelectedGroup({ ...selectedGroup, project: response._id });
                setSelectedProject(response);
                setSuccessPopup(true);
            }
        } catch (error) {
            setErrorPopup(true);
        }
    }

    useEffect(() => {
        if (selectedProject) {
            navigate('/student/project/details');
        }
    }, []);

    useEffect(() => {
        validateCreate();
    }, [title, description]);

    return (
        <>
            <SuccessPopup
                open={successPopup}
                onClose={() => {
                    setSuccessPopup(false);
                    navigate('/student/project/details');
                }}
                content='Project created successfully'
            />
            <ErrorPopup
                open={errorPopup}
                onClose={() => {
                    setErrorPopup(false);
                    navigate('/student/project/details');
                }}
                content={error!}
            />
            <ContentPanel
                title="Create Project"
                hasBackButton
                backLink="/student/project/details"
                titleIcon={<AddBoxOutlined fontSize="large" />}
                loadingPopup={{ open: loading }}
                content={
                    <div>
                        <FormControl fullWidth>
                            {/* Project Title */}
                            <TextField
                                label="Project Title"
                                placeholder="Title"
                                variant="outlined"
                                value={title}
                                onChange={onTitleChange}
                                inputProps={{ maxLength: 100 }}
                                helperText={`${title.length}/100`}
                            />
                            <br />
                            {/* Project Description */}
                            <TextField
                                label="Project Description"
                                placeholder="Description"
                                variant="outlined"
                                multiline
                                rows={2}
                                value={description}
                                onChange={onDescriptionChange}
                                inputProps={{ maxLength: 200 }}
                                helperText={`${description.length}/100`}
                            />
                            <br />
                        </FormControl>
                        <Button variant="contained" disabled={!validCreate} onClick={onCreateProject}
                            color="success">CREATE</Button>
                    </div>
                }
            ></ContentPanel>
        </>
    );
}

export default ProjectProposalCreate;
