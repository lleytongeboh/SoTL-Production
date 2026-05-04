import { Box, Modal, Typography } from "@mui/material";
import Lottie from "lottie-react";
import { useEffect, useState } from "react";

export interface PopupProps {
    content: React.ReactNode;
    open: boolean;
    onClose?: () => void;
}

const SuccessPopup: React.FC<PopupProps> = ({ content, open, onClose }) => {
    const [animationData, setAnimationData] = useState(null);

    useEffect(() => {
        // Fetch the Lottie file
        fetch("https://lottie.host/8b5e781b-eeec-4888-a0b0-6cd7a186460f/16TyafbG5P.json")
            .then((response) => response.json())
            .then((data) => setAnimationData(data));
    }, []);

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
                {typeof content === 'string' && <Typography id="modal-modal-title" variant="h6" component="h2" className="text-center">
                    {content}
                </Typography>}
                {typeof content !== 'string' && content}
                <Lottie
                    animationData={animationData} // use fetched data
                    style={{ height: 300, width: 300 }}
                    loop
                    autoplay
                />
                </div>
            </Box>
        </Modal>
    );
}

export default SuccessPopup;