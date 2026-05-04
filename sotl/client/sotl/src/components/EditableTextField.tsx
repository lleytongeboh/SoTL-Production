import { FormControl, FormHelperText, TextField, InputLabel, Typography } from '@mui/material';
import React from 'react';

interface EditableTextFieldProps {
    label: string;
    value: string;
    onChange: (s: string) => void;
    isEdit: boolean;
    className?: string;
    iconButton?: React.ReactNode;
    helperText?: string;
    textFieldProp?: any; 
}

const EditableTextField: React.FC<EditableTextFieldProps> = ({ label, value, onChange, isEdit, className = undefined, iconButton, helperText=undefined, textFieldProp = undefined }) => {
    return (
        <>
            {
                isEdit ? (
                    <FormControl fullWidth className={className}>
                        <TextField
                            id="outlined-required"
                            label={label}
                            placeholder={`Enter ${label}`}
                            value={value}
                            onChange={(e) => onChange(e.target.value as string)}
                            {...textFieldProp}
                        />
                        <FormHelperText sx={{color:'red'}}>{helperText}</FormHelperText>
                    </FormControl>
                ) : (
                    <Typography className={className}>{value} {iconButton}</Typography>
                )
            }
        </>
    );
};

export default EditableTextField;