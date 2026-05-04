import { FormControl, Select, MenuItem, InputLabel, Typography, IconButton } from '@mui/material';
import { Close, Add } from '@mui/icons-material';
import React from 'react';

interface EditableRowContainerProps {
    labelId: string;
    label: string;
    value: string;
    onChange: (s: string) => void;
    onRemove: (s: string) => void;
    isEdit: boolean;
    className?: string;
    iconButton?: React.ReactNode;
    itemList?: string[];
    itemList2?: string[];
    onAddBatchChange: (s: string) => void;
};

const EditableRowContainer: React.FC<EditableRowContainerProps> = ({ labelId, label, value, onChange, onRemove, isEdit, className = undefined, itemList = undefined, itemList2 = undefined, onAddBatchChange }) => {
    const [isAdd, setIsAdd] = React.useState(false);
    return (
        <>
            {
                isEdit ? (
                    <div
                        className={'flex flex-col justify-start gap-6 ' + className}
                    >
                        {itemList && itemList.map((item: string, index: number) => (
                            <div
                                key={index} className='flex flex-row gap-6'
                            >
                                <div
                                    className='flex flex-row  justify-start items-center rounded-lg border border-gray-300 p-2'
                                    style={{ width: '40%' }}
                                >
                                    <Typography >{item}</Typography>
                                </div>
                                <IconButton
                                    sx={{
                                        width: 48,       // Set width to your preferred size
                                        height: 48,      // Ensure height matches the width
                                        borderRadius: 1, // Set border-radius to 1 to make it a square
                                        backgroundColor: 'rgb(226,232,240)',
                                        color: 'inherit',
                                        '&:hover': {
                                            color: 'red',
                                        },
                                    }}
                                    onClick={() => onRemove(item)}
                                >
                                    <Close />
                                </IconButton>
                            </div>
                        ))}
                        {itemList2 && itemList2.length > 0 && !isAdd && (<IconButton
                            sx={{
                                width: 48,       // Set width to your preferred size
                                height: 48,      // Ensure height matches the width
                                borderRadius: 1, // Set border-radius to 1 to make it a square
                                backgroundColor: 'rgb(226,232,240)', // Set background color to gray-300
                                color: 'inherit',
                                '&:hover': {
                                    color: 'green',
                                },
                            }}
                            onClick={() => setIsAdd(true)}
                        >
                            <Add />
                        </IconButton>)}
                        {
                            isAdd && (
                                <div className='flex flex-row justify-start items-center gap-6'>
                                    <FormControl sx={{width: '40%'}} className='border'>
                                        <InputLabel id={'add-batch'}>{'Batch'}</InputLabel>
                                        <Select
                                            labelId={'add-batch'}
                                            id="add-batch-select"
                                            value={''}
                                            label="Batch *"
                                            onChange={(e) => {
                                                onAddBatchChange(e.target.value as string)
                                                setIsAdd(false)
                                            }}
                                        >
                                            {
                                                itemList2 && itemList2.map((item: string, index: number) => {
                                                    return (
                                                        <MenuItem value={item} key={index}>
                                                            {item}
                                                        </MenuItem>
                                                    )
                                                })
                                            }
                                        </Select>
                                    </FormControl>
                                    <IconButton
                                        sx={{
                                            width: 48,       // Set width to your preferred size
                                            height: 48,      // Ensure height matches the width
                                            borderRadius: 1, // Set border-radius to 1 to make it a square
                                            backgroundColor: 'rgb(226,232,240)',
                                            color: 'inherit',
                                            '&:hover': {
                                                color: 'red',
                                            },
                                        }}
                                        onClick={() => setIsAdd(false)}
                                    >
                                        <Close />
                                    </IconButton>
                                </div>
                            )
                        }
                    </div>

                ) : (
                    <FormControl fullWidth className={className}>
                        <InputLabel id={labelId}>{label}</InputLabel>
                        <Select
                            labelId={labelId}
                            id="select-required"
                            value={value}
                            label="Project *"
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
                )
            }
        </>
    );
};

export default EditableRowContainer;