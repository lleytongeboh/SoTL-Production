import { Box, CircularProgress, Modal, Typography } from "@mui/material";
import { PopupProps } from "./SuccessPopup";

export interface LoadingPopupProps extends Omit<PopupProps, 'content'> {
    content?: string;
}

const LoadingPopup: React.FC<LoadingPopupProps> = ({ content, open, onClose }) => {

    const style = {
        position: 'absolute' as 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            aria-describedby="modal-modal-description"
        >
            <Box sx={style}>
                <div className="flex flex-col items-center">
                <CircularProgress size={250}/>
                <br />
                <Typography id="modal-modal-description" variant="h6" component="h2" className="text-center">
                    {content ? content : 'Loading...'}
                </Typography>
                </div>
            </Box>
        </Modal>
    );
}

export default LoadingPopup;