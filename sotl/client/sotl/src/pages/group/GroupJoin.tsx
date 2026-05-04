import { Button } from "@mui/material";
import ContentPanel from "../../components/ContentPanel";
import { useNavigate, useParams } from "react-router-dom";
import ProjectRolesCheckBox from "../../components/ProjectRolesCheckBox";
import { useEffect, useState } from "react";
import { groupHooks } from "../../features/student/group/hooks/groupHooks";
import { useGroup } from "../../features/student/group/context/GroupContext";
import SuccessPopup from "../../components/SuccessPopup";
import ErrorPopup from "../../components/ErrorPopup";
import { useProject } from "../../features/student/project/context/ProjectContext";
import { projectHooks } from "../../features/student/project/hooks/projectHooks";
import { LoadingPopupProps } from "../../components/LoadingPopup";

const GroupJoin: React.FC = () => {
    const { groupId } = useParams();
    const { joinGroup, error: gErr, loading : gLoad } = groupHooks();
    const { checkProject, error: pErr, loading  } = projectHooks();
    const { selectedGroup, setSelectedGroup } = useGroup();
    const { setSelectedProject } = useProject();
    const [roles, setRoles] = useState<Map<string, boolean> | null>(null);
    const [error, setError] = useState(true);
    const [successPopup, setSuccessPopup] = useState(false);
    const [errorPopup, setErrorPopup] = useState(false);

    const navigate = useNavigate();

    const loadingPopupProps : LoadingPopupProps = {
        open: loading || gLoad
    };

    const handleCheckBoxData = (data: Map<string, boolean>, error: boolean) => {
        setRoles(data);
        setError(error);
    };

    const onJoin = async () => {
        try {
            const response = await joinGroup(groupId!, Array.from(roles!.entries()).filter((role) => role[1]).map((role) => role[0]));
            const project = await checkProject(response._id!);
            if (response && project) {
                setSuccessPopup(true);
                setSelectedGroup(response);
                setSelectedProject(project);
            } else if (response) {
                setSuccessPopup(true);
                setSelectedGroup(response);
            } else {
                setErrorPopup(true);
            }
        } catch (error) {
            setErrorPopup(true);
        }
    };

    useEffect(() => {
        if (selectedGroup) {
            navigate('/student/project/details');
        }
    },[selectedGroup]);

    return <>
        <SuccessPopup
            open={successPopup}
            onClose={() => {
                setSuccessPopup(false);
                navigate('/student/project/details');
            }}
            content='Group Joined Successfully!'
        />
        <ErrorPopup
            open={errorPopup}
            onClose={() => {
                setErrorPopup(false);
                navigate('/student/group/list');
            }}
            content={gErr || pErr!}
        />
        <ContentPanel
            title="Select Role"
            hasBackButton
            loadingPopup={loadingPopupProps}
            backLink={`/student/group/list`}
            content={
                <div>
                    <p>Select the role you want to join as.</p>
                    <br />
                    <ProjectRolesCheckBox
                        onReturnData={handleCheckBoxData}
                    />
                    <Button variant="contained" color="success" onClick={onJoin} disabled={error}>JOIN</Button>
                </div>
            }
        />
    </>
};

export default GroupJoin;