import { Box, Button, Modal, Typography } from "@mui/material";
import Lottie from "lottie-react";
import React, { useEffect, useState } from "react";

interface ConfirmationPopupProps {
    open: boolean;
    content?: React.ReactNode;
    onClose?: () => void;
    onConfirm?: () => void;
}

const ConfirmationPopup: React.FC<ConfirmationPopupProps> = ({ open, content, onClose, onConfirm }) => {
    const [animationData, setAnimationData] = useState(null);

    useEffect(() => {
        // Fetch the Lottie file
        fetch("https://lottie.host/7c1d6c04-f728-4dbe-982a-a03b066a51e0/b6uWt7TwIK.json")
            .then((response) => response.json())
            .then((data) => setAnimationData(data));
    }, []);

    const style = {
        position: 'absolute' as 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        overflowY: 'auto',
        maxHeight: '100%',
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
                    <Lottie
                        animationData={animationData} // use fetched data
                        style={{ height: 300, width: 300 }}
                        loop
                        autoplay
                    />
                    <Typography id="modal-modal-title" sx={{ maxWidth: '100%' }} variant="h6" component="h2" className="text-center">
                        {content ?? "Are You Sure?"}
                    </Typography>
                    <br />
                    <Box sx={{ display: 'flex', justifyContent: 'space-around', width: '100%' }}>
                        <Button variant="contained" color="success" onClick={onConfirm}>CONFIRM</Button>
                        <Button variant="contained" color="error" onClick={onClose}>CANCEL</Button>
                    </Box>
                </div>
            </Box>
        </Modal>
    );
}

export default ConfirmationPopup;