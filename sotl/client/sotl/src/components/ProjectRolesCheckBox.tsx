import { Box, Checkbox, FormControl, FormControlLabel, FormHelperText } from "@mui/material";
import { PROJECT_ROLES } from "../utils/constants";
import { useEffect, useState } from "react";

interface ProjectRolesCheckBoxProps {
    initialRoles?: Map<string, boolean>;
    onReturnData: (data: Map<string, boolean>, error: boolean) => void;
}

const ProjectRolesCheckBox: React.FC<ProjectRolesCheckBoxProps> = ({ onReturnData, initialRoles }) => {
    const roleMapping: Map<string, boolean> = new Map(PROJECT_ROLES.map((role) => [role, false]));
    const [roles, setRoles] = useState(roleMapping);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const minSelection = 1;
        const newRoles = new Map(roles);
        newRoles.set(event.target.name, event.target.checked);
        const error = Array.from(newRoles.values()).filter((role) => role).length < minSelection;
        setRoles(newRoles);
        onReturnData(newRoles, error);
    };

    useEffect(() => {
        if (initialRoles) {
            setRoles(initialRoles);
        } else {
            onReturnData(roles, true);
        }
    }, [initialRoles]);

    return <Box>
        <FormControl>
            {PROJECT_ROLES.map((role) => (
                <FormControlLabel
                    key={role}
                    control={
                        <Checkbox
                            name={role}
                            checked={roles.get(role) || false}
                            onChange={handleChange}
                        />
                    }
                    label={role}
                />
            ))}
            <FormHelperText>** Please select at least ONE role</FormHelperText>
            <br />
        </FormControl>
    </Box>;
};

export default ProjectRolesCheckBox;