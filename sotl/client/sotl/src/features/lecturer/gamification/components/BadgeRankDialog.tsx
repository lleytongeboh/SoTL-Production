import { Box, Button, Modal, TextField, Typography, Select, MenuItem, IconButton } from "@mui/material";
import { Close, WorkspacePremium, TaskAlt } from "@mui/icons-material";
import Lottie from "lottie-react";
import { BadgeList, Badge, DeliverableCompletion } from "../models";
import React from "react";

type PopupProps = {
    open: boolean;
    onClose: () => void;
    badgeList: BadgeList[];
};


const CommentPopup: React.FC<PopupProps> = ({ open, onClose, badgeList = [] }) => {
    const [batchSelected, setBatchSelected] = React.useState<string>('');
    const [animationData, setAnimationData] = React.useState(null);

    React.useEffect(() => {
        fetch('https://lottie.host/02d04b69-7919-47c4-b46e-f03fab1b155b/z8U03eRPtM.json')
            .then((response) => response.json())
            .then((data) => setAnimationData(data))
            .catch((error) => console.error("Failed to load animation data:", error));
    }, []);

    React.useEffect(() => {
        if (badgeList.length > 0) {
            setBatchSelected(badgeList[0]._id);
        }
    }, [badgeList]);
    const style = {
        position: 'absolute' as 'absolute',
        top: '50%',
        left: '50%',
        margin: 'auto',
        transform: 'translate(-50%, -50%)',
        width: "70%",
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        minHeight: '70%',
        p: 4,
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby="modal-modal-title"
        >
            <Box sx={style}>
                <div className="flex flex-col items-center gap-2">
                    <div
                        className="flex flex-row justify-end items-center w-full"
                    >
                        <IconButton onClick={onClose}>
                            <Close fontSize="medium" sx={{ color: 'black' }} />
                        </IconButton>
                    </div>
                    <div
                        className="flex flex-row justify-between items-center w-full"
                    >
                        <Typography id="modal-modal-title" variant="h6" component="h2" className="text-center">
                            Badge Description
                        </Typography>
                        {
                            badgeList.length > 0 && (
                                <Select
                                    labelId="demo-simple-select-label"
                                    id="demo-simple-select"
                                    value={batchSelected}
                                    label="Age"
                                    onChange={(e) => {
                                        setBatchSelected(e.target.value as string);
                                    }}
                                    sx={{ width: '20%' }}
                                >
                                    {
                                        badgeList.map((badgeListItem: BadgeList) => (
                                            <MenuItem value={badgeListItem._id}>{badgeListItem.batch}</MenuItem>
                                        ))
                                    }
                                </Select>
                            )
                        }
                    </div>
                    <div
                        className="flex flex-col items-center w-full"
                    >
                        {
                            badgeList.length === 0 && (
                                <>
                                    {!animationData ? (
                                        <Typography>Loading animation...</Typography>
                                    ) : (
                                        <Lottie animationData={animationData} style={{ height: 300, width: 300 }} loop autoplay />
                                    )}
                                </>
                            )
                        }
                        {
                            badgeList.length > 0 && (
                                <>
                                    <div
                                        className="flex flex-col items-center w-full border border-gray-300"
                                    >
                                        {
                                            badgeList.find((badgeListItem: BadgeList) => badgeListItem._id === batchSelected)?.badges.map((badge: Badge) => (
                                                <div
                                                    className="flex flex-row justify-start items-start w-full border-b border-gray-300 p-2"
                                                >
                                                    <div
                                                        className="flex-none"
                                                    >
                                                        <WorkspacePremium sx={{ fontSize: '100px', color: badge.color }} />
                                                    </div>
                                                    <div
                                                        className="flex flex-col justify-start items-start"
                                                    >
                                                        <Typography id="modal-modal-title" variant="body1" component="h2" className="text-center font-bold text-gray-500">
                                                            {badge.name}
                                                        </Typography>
                                                        <Typography id="modal-modal-title" variant="body1" component="h2" className="text-center text-gray-500">
                                                            {badge.description}
                                                        </Typography>
                                                        <div
                                                            className="flex flex-row justify-start items-start flex-wrap"
                                                        >
                                                            {
                                                                badge.deliverableCompletion.map((deliverableCompletion: DeliverableCompletion, index: number) => (
                                                                    <div
                                                                        key={index}
                                                                        className="flex flex-row flex-wrap min-w-0 px-2 gap-2"
                                                                    >
                                                                        <div>
                                                                            <TaskAlt sx={{ fontSize: '20px', color: 'gray' }} />
                                                                        </div>
                                                                        <p
                                                                            className="text-center text-gray-500 break-words"
                                                                        >
                                                                            {deliverableCompletion.name}
                                                                        </p>

                                                                    </div>
                                                                ))
                                                            }
                                                        </div>
                                                    </div>

                                                </div>
                                            ))
                                        }
                                    </div>
                                    {
                                        badgeList.find((badgeListItem: BadgeList) => badgeListItem._id === batchSelected)?.badges.length === 0 && (
                                            <>
                                                {!animationData ? (
                                                    <Typography>Loading animation...</Typography>
                                                ) : (
                                                    <Lottie animationData={animationData} style={{ height: 300, width: 300 }} loop autoplay />
                                                )}
                                            </>
                                        )
                                    }
                                </>
                            )
                        }
                    </div>
                </div>
            </Box>
        </Modal>
    );
};

export default CommentPopup;