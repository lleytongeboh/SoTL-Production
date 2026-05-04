import { FormControl, Select, MenuItem, InputLabel } from '@mui/material';
import React from 'react';

interface SelectionBoxProps {
    labelId: string;
    label: string;
    value: string;
    onChange: (s: string) => void;
    className?: string;
    iconButton?: React.ReactNode;
    itemList?: string[];
};

const SelectionBox: React.FC<SelectionBoxProps> = ({ labelId, label, value, onChange, className = undefined, itemList = undefined }) => {
    return (
        <FormControl fullWidth className={className}>
            <InputLabel id={labelId}>{label}</InputLabel>
            <Select
                labelId={labelId}
                id="select-required"
                value={value}
                label="Batch"
                onChange={(e) => onChange(e.target.value as string)}
                sx={{ width: '40%' }}
            >
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
    );
};

export default SelectionBox;