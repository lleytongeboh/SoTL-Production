import React, { useEffect, useState } from "react";
import ContentPanel from "../../components/ContentPanel";
import { Edit, Save } from "@mui/icons-material";
import { Button, FormControl, TextField } from "@mui/material";
import { useProject } from "../../features/student/project/context/ProjectContext";
import { Project } from "../../features/student/project/models";
import { projectHooks } from "../../features/student/project/hooks/projectHooks";
import { useLocation, useNavigate } from "react-router-dom";
import { PopupProps } from "../../components/SuccessPopup";
import { LoadingPopupProps } from "../../components/LoadingPopup";
import ConfirmationPopup from "../../components/ConfirmationPopup";

const ProjectDetailsEdit: React.FC = () => {
    const [title, setTitle] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [errorPopup, setErrorPopup] = useState<boolean>(false);
    const [successPopup, setSuccessPopup] = useState<boolean>(false);
    const [confirmPopup, setConfirmPopup] = useState<boolean>(false);
    const [isValidSave, setIsValidSave] = useState<boolean>(false);

    const { editProject, error, loading } = projectHooks();
    const { selectedProject, setSelectedProject }: { selectedProject: Project, setSelectedProject: React.Dispatch<React.SetStateAction<Project | null>> } = useProject();
    const { state } = useLocation();
    const projectToEdit: Project = (state as { project?: Project } | null)?.project ?? selectedProject;
    const navigate = useNavigate();

    const errorPopupProps: PopupProps = {
        content: error!,
        open: errorPopup,
        onClose: () => {
            setErrorPopup(false);
            navigate('/student/project/details');
        }
    };

    const successPopupProps: PopupProps = {
        content: 'Project information updated successfully!',
        open: successPopup,
        onClose: () => {
            setSuccessPopup(false);
            navigate('/student/project/details');
        }
    };

    const loadingPopupProps: LoadingPopupProps = {
        open: loading,
    };

    const onSave = async () => {
        try {
            const response = await editProject(projectToEdit._id!, { ...projectToEdit, title, description });
            if (response) {
                if (selectedProject._id === response._id) {
                    setSelectedProject(response);
                }
                setSuccessPopup(true);
            }
        } catch (error) {
            setErrorPopup(true);
        }
    };

    const handleValidateSave = () => {
        if (title.length > 0 && description.length > 0) {
            setIsValidSave(true);
        } else {
            setIsValidSave(false);
        }
    };

    useEffect(() => {
        setTitle(projectToEdit.title);
        setDescription(projectToEdit.description);
    }, []);

    useEffect(() => {
        handleValidateSave();
    }, [title, description]);

    return <>
        <ConfirmationPopup
            open={confirmPopup}
            onClose={() => setConfirmPopup(false)}
            onConfirm={() => {
                setConfirmPopup(false);
                onSave();
            }}
            content="Are you sure you want to save the changes?"
        />
        <ContentPanel
            title="Edit Project Information"
            titleIcon={<Edit />}
            hasBackButton
            errorPopup={errorPopupProps}
            successPopup={successPopupProps}
            loadingPopup={loadingPopupProps}
            backLink="/student/project/details"
            content={
                <>
                    <FormControl fullWidth>
                        <TextField
                            label="Project Name"
                            variant="outlined"
                            fullWidth
                            value={title}
                            inputProps={{ maxLength: 100 }}
                            helperText={`${title.length}/100`}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                        <br />
                    </FormControl>
                    <FormControl fullWidth>
                        <TextField
                            label="Project Description"
                            variant="outlined"
                            fullWidth
                            value={description}
                            inputProps={{ maxLength: 200 }}
                            helperText={`${description.length}/200`}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                        <br />
                    </FormControl>
                    <Button color="success" disabled={!isValidSave} variant="contained" onClick={() => setConfirmPopup(true)} startIcon={<Save />}>
                        SAVE
                    </Button>
                </>
            }
        />;
    </>
}

export default ProjectDetailsEdit;
