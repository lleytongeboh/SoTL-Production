import ContentPanel from "../../components/ContentPanel";
import { Edit } from "@mui/icons-material";
import React, { useEffect, useState } from "react";
import { Button } from "@mui/material";
import ErrorPopup from "../../components/ErrorPopup";
import SuccessPopup from "../../components/SuccessPopup";
import { useNavigate } from "react-router-dom";
import { useGroup } from "../../features/student/group/context/GroupContext";
import { Group, TeamMember } from "../../features/student/group/models";
import { groupHooks } from "../../features/student/group/hooks/groupHooks";
import _ from "lodash";
import ProjectRolesCheckBox from "../../components/ProjectRolesCheckBox";
import { useAuth } from "../../features/auth/context";
import { PROJECT_ROLES } from "../../utils/constants";

const ProjectRoleEdit: React.FC = () => {
    const [roles, setRoles] = useState<Map<string, boolean> | null>(null);
    const [error, setError] = useState(false);
    const [successPopup, setSuccessPopup] = useState<boolean>(false);
    const [errorPopup, setErrorPopup] = useState<boolean>(false);

    const { identity } = useAuth();
    const { selectedGroup, setSelectedGroup }: { selectedGroup: Group, setSelectedGroup: React.Dispatch<React.SetStateAction<Group | null>> } = useGroup();
    const { editProjectRole, error: pErr }: { editProjectRole: (group_id: string, role: string[]) => Promise<Group>, error: string | null } = groupHooks();

    const navigate = useNavigate();

    const handleCheckBoxData = (data: Map<string, boolean>, error: boolean) => {
        setRoles(data);
        setError(error);
    };

    const onSave = async () => {
        try {
            const response: Group = await editProjectRole(selectedGroup._id!, Array.from(roles!.entries()).filter((role) => role[1]).map((role) => role[0]));
            if (response) {
                const updatedTeamMember: TeamMember[] = _.mergeWith([...selectedGroup.team_members], response.team_members, (objValue: any, srcValue: any) => {
                    return _.mergeWith(objValue, srcValue, (objValue: any, srcValue: any, key: string) => {
                        if (key === 'project_role') {
                            return srcValue;
                        }
                        return objValue;
                    });
                });
                setSelectedGroup({ ...response, team_members: updatedTeamMember });
                setSuccessPopup(true);
            }
        } catch (error) {
            setErrorPopup(true);
        }
    };

    useEffect(() => {
        const member = selectedGroup.team_members.find((member) => member.student_id === identity?._id);
        const r = new Map(PROJECT_ROLES.map((role) => [role, member?.project_role?.find((r) => r === role) ? true : false]));
        setRoles(r);
    }, []);

    return <>
        <SuccessPopup
            open={successPopup}
            onClose={() => {
                setSuccessPopup(false);
                navigate('/student/project/details');
            }}
            content={'Project role updated successfully!'}
        />
        <ErrorPopup
            open={errorPopup}
            onClose={() => {
                setErrorPopup(false);
                navigate('/student/project/details');
            }}
            content={pErr!}
        />
        <ContentPanel
            title="Edit Project Role"
            titleIcon={<Edit />}
            hasBackButton
            backLink="/student/project/details"
            content={
                <>
                    <ProjectRolesCheckBox
                        initialRoles={roles || undefined}
                        onReturnData={handleCheckBoxData}
                    />
                    <Button variant="contained" color="success" onClick={onSave} disabled={error}>
                        SAVE
                    </Button>
                </>
            }
        />
    </>
}

export default ProjectRoleEdit;