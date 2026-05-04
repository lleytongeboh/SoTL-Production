import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogTitle from '@mui/material/DialogTitle';
import ErrorIcon from '@mui/icons-material/Error';

interface AlertDialogProps {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    deleteData: string | null;
    setDeleteData: React.Dispatch<React.SetStateAction<string | null>>;
    handleDelete: () => void;
    handleCloseCall?: () => void;
}

const AlertDialog: React.FC<AlertDialogProps> = ({ open, setOpen, deleteData, setDeleteData, handleDelete, handleCloseCall }) => {
    const handleClose = () => {
        //call delete api
        if (handleCloseCall) {
            handleCloseCall();
        }
        setOpen(false);
        setDeleteData(null);
    };

    return (
        <React.Fragment>
            <Dialog
                open={open}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title" className="flex flex-row gap-1 items-center">
                    <ErrorIcon className='pt-' />Do You Want Delete {deleteData ?? ''}??
                </DialogTitle>
                <DialogActions sx={{ justifyContent: 'space-between' }}>
                    <Button variant="outlined" onClick={handleClose}>No</Button>
                    <Button variant="contained" onClick={handleDelete} autoFocus>
                        Yes
                    </Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}

export default AlertDialog;