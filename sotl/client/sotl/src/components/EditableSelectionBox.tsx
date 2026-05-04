import { FormControl, Select, MenuItem, InputLabel, SelectChangeEvent, Typography } from '@mui/material';
import { GroupProject } from '../features/lecturer/user/models';
import React from 'react';

interface EditableSelectFieldProps {
    labelId: string;
    label: string;
    value: string;
    onChange: (s: string) => void;
    isEdit: boolean;
    className?: string;
    iconButton?: React.ReactNode;
    projectList?: GroupProject[];
    itemList?: string[];
};

const EditableSelectionBox: React.FC<EditableSelectFieldProps> = ({ labelId, label, value, onChange, isEdit, className = undefined, iconButton, projectList = undefined, itemList = undefined }) => {
    return (
        <>
            {
                isEdit ? (
                    <FormControl fullWidth className={className}>
                        <InputLabel id={labelId}>{label}</InputLabel>
                        <Select
                            labelId={labelId}
                            id="select-required"
                            value={value}
                            label="Project *"
                            onChange={(e) => onChange(e.target.value as string)}
                        >
                            <MenuItem value="">
                                <em>None</em>
                            </MenuItem>
                            {
                                projectList && projectList.map((project: GroupProject, index: number) => {
                                    return (
                                        <MenuItem value={project.project._id} key={index}>
                                            {project.project.title}
                                        </MenuItem>
                                    )
                                })
                            }
                            {
                                itemList && itemList.map((item: string, index: number) => {
                                    return (
                                        <MenuItem value={item} key={index}>
                                            {item}
                                        </MenuItem>
                                    )
                                })
                            }
                        </Select>
                    </FormControl>
                ) : (
                    <Typography className={className}>{itemList?value:projectList?.find((x)=>x.project._id === value)?.project.title} {iconButton}</Typography>
                )
            }
        </>
    );
};

export default EditableSelectionBox;