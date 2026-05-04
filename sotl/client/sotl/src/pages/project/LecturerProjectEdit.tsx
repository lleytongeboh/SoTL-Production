import ContentPanel from "../../components/ContentPanel";
import { Edit, Save } from "@mui/icons-material";
import { Button, FormControl, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { projectHooks } from "../../features/student/project/hooks/projectHooks";
import { PopupProps } from "../../components/SuccessPopup";
import { LoadingPopupProps } from "../../components/LoadingPopup";
import ConfirmationPopup from "../../components/ConfirmationPopup";
import { Project } from "../../features/student/project/models";

const LecturerProjectEdit: React.FC = () => {
    const [title, setTitle] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [errorPopup, setErrorPopup] = useState<boolean>(false);
    const [successPopup, setSuccessPopup] = useState<boolean>(false);
    const [confirmPopup, setConfirmPopup] = useState<boolean>(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isValidSave, setIsValidSave] = useState<boolean>(false);

    const { getProject, editProject, loading, error } = projectHooks();
    const { projectId } = useParams();
    const navigate = useNavigate();

    const errorPopupProps: PopupProps = {
        open: errorPopup,
        content: error!,
        onClose: () => {
            setErrorPopup(false);
            navigate(-1);
        }
    };

    const successPopupProps: PopupProps = {
        open: successPopup,
        content: 'Project information updated successfully!',
        onClose: () => {
            setSuccessPopup(false);
            navigate(-1);
        }
    };

    const loadingPopupProps: LoadingPopupProps = {
        open: loading
    };

    const onSave = async () => {
        try {
            const response = await editProject(selectedProject!._id!, { ...selectedProject!, title, description });
            if (response) {
                setSuccessPopup(true);
            }
        } catch (error) {
            setErrorPopup(true);
        }
    };

    const fetchData = async () => {
        try {
            const project = await getProject(projectId!);
            setSelectedProject(project);
            setTitle(project.title);
            setDescription(project.description);
        } catch (error) {
            setErrorPopup(true);
        }
    };

    const validateSave = () => {
        if (title.length > 0 && description.length > 0) {
            setIsValidSave(true);
        } else {
            setIsValidSave(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        validateSave();
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
            backLink={-1}
            errorPopup={errorPopupProps}
            successPopup={successPopupProps}
            loadingPopup={loadingPopupProps}
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

export default LecturerProjectEdit;