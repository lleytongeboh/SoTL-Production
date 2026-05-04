import React from "react";
import "gantt-task-react/dist/index.css";
import { ViewMode } from "gantt-task-react";
import { Box, Button, FormControlLabel, Switch } from "@mui/material";
type ViewSwitcherProps = {
    isChecked: boolean;
    onViewListChange: (isChecked: boolean) => void;
    onViewModeChange: (viewMode: ViewMode) => void;
};
export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
    onViewModeChange,
    onViewListChange,
    isChecked,
}) => {
    return (
        <Box display={'flex'} gap={2}>
            <Button
                variant="outlined"
                onClick={() => onViewModeChange(ViewMode.Hour)}
            >
                Hour
            </Button>
            <Button
                variant="outlined"
                onClick={() => onViewModeChange(ViewMode.QuarterDay)}
            >
                Quarter of Day
            </Button>
            <Button
                variant="outlined"
                onClick={() => onViewModeChange(ViewMode.HalfDay)}
            >
                Half of Day
            </Button>
            <Button
                variant="outlined"
                onClick={() => onViewModeChange(ViewMode.Day)}>
                Day
            </Button>
            <Button
                variant="outlined"
                onClick={() => onViewModeChange(ViewMode.Week)}
            >
                Week
            </Button>
            <Button
                variant="outlined"
                onClick={() => onViewModeChange(ViewMode.Month)}
            >
                Month
            </Button>
            <Button
                variant="outlined"
                onClick={() => onViewModeChange(ViewMode.Year)}
            >
                Year
            </Button>
            <FormControlLabel
                control={<Switch defaultChecked />}
                label="Show Tasks List"
                value={isChecked}
                onChange={() => onViewListChange(!isChecked)}
            />
        </Box>
    );
};