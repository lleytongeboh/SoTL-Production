import SelectionBox from "../../../../components/SelectionBox";
import { Typography } from "@mui/material";
import React from 'react';

interface SelectionTextBoxProps {
    isEdit: boolean;
    labelId: string;
    label: string;
    value: string;
    onChange: (s: string) => void;
    className?: string;
    iconButton?: React.ReactNode;
    itemList?: string[];
};


const SelectionTextBox: React.FC<SelectionTextBoxProps> = ({ isEdit, labelId, label, value, onChange, className = undefined, itemList = undefined }) => {
    return (
        <>
        {
            isEdit?
            (<SelectionBox
                labelId={labelId}
                label={label}
                value={value}
                onChange={onChange}
                itemList={itemList}
                className={className}
            />):
            (<Typography className={className}>{value || ''}</Typography>)
        }
        </>
    );
};

export default SelectionTextBox;