import { Box, Button, Modal, TextField, Typography } from "@mui/material";
import { PopupProps } from "./SuccessPopup";

const CommentPopup: React.FC<PopupProps> = ({ content, open, onClose }) => {
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
            aria-labelledby="modal-modal-title"
        >
            <Box sx={style}>
                <div className="flex flex-col items-center">
                    <Typography id="modal-modal-title" variant="h6" component="h2" className="text-center">
                        View Comment
                    </Typography>
                    <br />
                    <TextField multiline fullWidth minRows={2} value={content} InputProps={{ readOnly: true }}></TextField>
                    <br />
                    <Button variant="contained" color="success" onClick={onClose}>CLOSE</Button>
                </div>
            </Box>
        </Modal>
    );
};

export default CommentPopup;