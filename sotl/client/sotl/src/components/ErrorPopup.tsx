import { Box, Modal, Typography } from "@mui/material";
import Lottie from "lottie-react";
import { useEffect, useState } from "react";
import { PopupProps } from "./SuccessPopup";

const ErrorPopup: React.FC<PopupProps> = ({ content, open, onClose }) => {
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
            aria-describedby="modal-modal-description"
        >
            <Box sx={style}>
                <div className="flex flex-col items-center">
                <Typography id="modal-modal-title" variant="h6" component="h2" className="text-center">
                    Opps! An Error Occurred...
                </Typography>
                <Lottie
                    animationData={animationData} // use fetched data
                    style={{ height: 300, width: 300 }}
                    loop
                    autoplay
                />
                <Typography sx={{ whiteSpace: 'pre-wrap'}} id="modal-modal-description" variant="h6" component="h2" className="text-center">
                    {content}
                </Typography>
                </div>
            </Box>
        </Modal>
    );
}

export default ErrorPopup;