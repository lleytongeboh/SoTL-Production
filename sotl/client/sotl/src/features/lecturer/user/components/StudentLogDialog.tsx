import { Box, Modal, Typography } from "@mui/material";
import { ExtendedStudentLogProps } from "../models";
import moment from 'moment';

interface StudentDialogProps {
    open: boolean;
    onClose?: () => void;
    studentLog: ExtendedStudentLogProps | null;
}

const StudentLogDialog: React.FC<StudentDialogProps> = ({ open, onClose, studentLog }) => {

    const style = {
        position: 'absolute' as 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '60%',
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
    };

    console.log('dialog', studentLog);

    if (studentLog === null && !open) {
        return undefined;
    }

    return (
        <>
            <Modal
                open={open}
                onClose={onClose}
                aria-labelledby="modal-modal-title"
            >
                <Box sx={style}>
                    <div
                        className="flex flex-col items-start "
                    >
                        <div
                            className="flex flex-row justify-start items-center w-full border-b-2 border-gray-200"
                        >
                            <Typography variant="h5" component="p" className="text-start flex-1 break-words font-bold">
                                Student Log #{studentLog?.no}
                            </Typography>
                        </div>
                        <div
                            className="flex flex-row justify-start items-center w-full  border-b-2 border-gray-200"
                        >
                            <Typography variant="body1" component="p" className="text-start flex-1 break-words">
                                Batch
                            </Typography>

                            <Typography variant="body1" component="p" className="text-start flex-1 break-words">
                                {studentLog?.batch}
                            </Typography>
                        </div>

                        <div
                            className="flex flex-row justify-start items-center w-full  border-b-2 border-gray-200"
                        >
                            <Typography variant="body1" component="p" className="text-start flex-1 break-words">
                                Task ID
                            </Typography>

                            <Typography variant="body1" component="p" className="text-start flex-1 break-words">
                                {studentLog?.jobId}
                            </Typography>
                        </div>

                        <div
                            className="flex flex-row justify-start items-start w-full border-b-2 border-gray-200"
                        >
                            <Typography variant="body1" component="p" className="text-start flex-1 break-words">
                                Task Content
                            </Typography>

                            <Typography variant="body1" component="p" className="text-start flex-1 break-words">
                                {studentLog?.jobContent}
                            </Typography>
                        </div>
                        <div
                            className="flex flex-row justify-start items-center w-full border-b-2 border-gray-200"
                        >
                            <Typography variant="body1" component="p" className="text-start flex-1 break-words">
                                Status
                            </Typography>

                            <Typography variant="body1" component="p" className="text-start flex-1 break-words">
                                {studentLog?.status}
                            </Typography>
                        </div>
                        <div
                            className="flex flex-row justify-start items-center w-full border-b-2 border-gray-200"
                        >
                            <Typography variant="body1" component="p" className="text-start items-start flex-1 break-words">
                                error
                            </Typography>

                            <Typography variant="body1" component="p" className="text-start flex-1 break-words">
                                {studentLog?.error ?? '-'}
                            </Typography>
                        </div>

                        <div
                            className="flex flex-row justify-start items-center w-full border-b-2 border-gray-200"
                        >
                            <Typography variant="body1" component="p" className="text-start flex-1 break-words">
                                Created At
                            </Typography>

                            <Typography variant="body1" component="p" className="text-start flex-1 break-words">
                                {moment(studentLog?.createdAt).format('DD/MM/YYYY h:mm:ss')}
                            </Typography>
                        </div>
                        <div
                            className="flex flex-row justify-start items-center w-full border-b-2 border-gray-200"
                        >
                            <Typography variant="body1" component="p" className="text-start flex-1 break-words">
                                Updated At
                            </Typography>

                            <Typography variant="body1" component="p" className="text-start flex-1 break-words">
                                {moment(studentLog?.updatedAt).format('DD/MM/YYYY h:mm:ss')}
                            </Typography>
                        </div>
                    </div>
                </Box>
            </Modal>
        </>
    );
};

export default StudentLogDialog;