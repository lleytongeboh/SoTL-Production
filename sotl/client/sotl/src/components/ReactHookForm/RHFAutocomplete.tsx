import React, { ReactNode } from "react";
import Autocomplete from '@mui/material/Autocomplete';
import Checkbox from '@mui/material/Checkbox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import { Controller, useFormContext, FieldPath, FieldValues, Validate, FieldPathValue, RegisterOptions, UseControllerProps } from "react-hook-form";
import { SxProps, Theme } from "@mui/material";
import { createFilterOptions } from '@mui/material/Autocomplete';

// https://mui.com/material-ui/react-autocomplete/

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

const createdFilterOptions = createFilterOptions({
    trim: true
});


type RHFAutocompleteProps = {
    sx?: SxProps<Theme>;
    disabled?: boolean;
    fieldName: UseControllerProps['name'];
    multiple?: boolean;
    disableCloseOnSelect?: boolean;
    options: ReadonlyArray<any>;
    filterOptions?: (inputValue: string | null) => void;
    // onInputChange: (setLoading : (value: React.SetStateAction<boolean>) => void, value: string, reason?: AutocompleteInputChangeReason) => void;
    // filterOptions: (setLoading : (value: React.SetStateAction<boolean>) => void, options: any[], state: FilterOptionsState<any>) => any[];
    textFieldLabel: string;
    textFieldRequired?: boolean;
    getOptionLabel: (option: any) => string;
    validateRules?: RegisterOptions['validate'];
    noOptionsText?: React.ReactNode;
}

const RHFAutocomplete: React.FC<RHFAutocompleteProps> = ({ sx, disabled, fieldName, multiple = true, disableCloseOnSelect = true, options, filterOptions, textFieldLabel, textFieldRequired, getOptionLabel, validateRules, noOptionsText }) => {
    const [loading, setLoading] = React.useState(false);
    const [inputValue, setInputValue] = React.useState('');
    const { control, formState: { errors }, setValue } = useFormContext();
    const resetFilter = () => {
        if (!filterOptions || multiple) {
            return;
        }
        filterOptions(null);
    };

    React.useEffect(() => {
        if (!filterOptions) {
            return;
        }
        if (inputValue.trim() !== '') {
            setLoading(true);
        }
        filterOptions(inputValue);
    }, [inputValue]);

    React.useEffect(() => {
        setLoading(false);
    }, [options]);

    return (
        <Controller name={fieldName} control={control} rules={validateRules ? { validate: validateRules } : {}} render={({ field: { onChange, ...field } }) =>
            <Autocomplete sx={sx} disabled={disabled} {...field} onChange={(_, v) => setValue(fieldName, v)} filterOptions={createdFilterOptions} multiple={multiple} options={options} loading={loading} disableClearable disableCloseOnSelect={disableCloseOnSelect} getOptionLabel={getOptionLabel} getOptionKey={(o) => o._id} isOptionEqualToValue={(option, val) => option._id === val._id} onInputChange={filterOptions ? (_, v) => setInputValue(v) : undefined} noOptionsText={noOptionsText ?? 'No result'} onOpen={multiple ? undefined : resetFilter}
                renderOption={multiple ? (props, option, { selected }) => {
                    const { key, ...optionProps } = props;
                    return (
                        <li key={key} {...optionProps}>
                            <Checkbox icon={icon} checkedIcon={checkedIcon} style={{ marginRight: 8 }} checked={selected} />{getOptionLabel(option)}
                        </li>
                    );
                } : undefined}
                renderInput={(params) => (
                    <TextField {...params} required={textFieldRequired} label={textFieldLabel}
                        error={errors?.[fieldName] ? true : false} helperText={(errors?.[fieldName]?.message as string) || false}
                        InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                                <React.Fragment>
                                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                </React.Fragment>
                            ),
                        }}
                    />
                )}
            />}
        />
    );
};

export default RHFAutocomplete;