import { Avatar, Box, Button } from "@mui/material";
import { Comment } from "../../../features/student/project/models";
import moment from "moment";
import { useAuth } from "../../../features/auth/context";
import ConfirmationPopup from "../../../components/ConfirmationPopup";
import React from "react";
import ErrorPopup from "../../../components/ErrorPopup";
import { projectHooks } from "../../../features/student/project/hooks/projectHooks";
import LoadingPopup from "../../../components/LoadingPopup";
import QuillEditor from "../../../components/QuillEditor";

interface CommentBoxProps {
    comment: Comment;
    onRefresh: () => void;
};

const CommentBox: React.FC<CommentBoxProps> = ({ comment, onRefresh }) => {
    const { identity } = useAuth();
    const { editComment, deleteComment, error, loading } = projectHooks();
    const [content, setContent] = React.useState(comment.content);
    const [confirmPopup, setConfirmPopup] = React.useState(false);
    const [errorPopup, setErrorPopup] = React.useState(false);
    const [editing, setEditing] = React.useState(false);

    const handleEdit = async () => {
        try {
            const response = await editComment(comment._id!, content);
            if (response) {
                setEditing(false);
                onRefresh();
            }
        } catch (error: any) {
            setErrorPopup(true);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteComment(comment._id!);
            setConfirmPopup(false);
            onRefresh();
        } catch (error: any) {
            setErrorPopup(true);
        }
    }

    return <>
        <LoadingPopup open={loading} />
        <ErrorPopup
            open={errorPopup}
            content={error ?? 'An error occurred. Please try again.'}
            onClose={() => setErrorPopup(false)}
        />
        <ConfirmationPopup
            open={confirmPopup}
            content={'Are you sure you want to delete this comment?'}
            onConfirm={() => {
                handleDelete();
            }}
            onClose={() => setConfirmPopup(false)}
        />
        <Box padding='10px'>
            <Box display={'flex'} gap={2} alignItems={'center'}>
                <Avatar />
                {comment.user}
            </Box>
            <Box marginY={'10px'}>
                {editing && <QuillEditor
                    text={content}
                    setText={setContent}
                    readonly={!editing}
                    toolbar={editing}
                    border={editing}
                />}
                {!editing && <QuillEditor
                    text={comment.content}
                    setText={setContent}
                    readonly={true}
                    toolbar={false}
                    border={false}
                />}
            </Box>
            <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'}>
                <Box>
                    {identity?._id === comment.user_id &&
                        editing ? <Box display={'flex'} gap={1}><Button variant="contained" onClick={() => handleEdit()}>Save</Button>
                        <Button variant="outlined" onClick={() => { setEditing(false); setContent(comment.content) }}>Cancel</Button></Box> :
                        <Box display={'flex'} gap={1}><Button variant="text" onClick={() => setEditing(true)}>Edit</Button>
                            <Button variant="text" onClick={() => setConfirmPopup(true)}>Delete</Button></Box>
                    }
                </Box>
                <Box>
                    {moment(comment.created_at).format('DD/MM/YYYY HH:mm')}
                </Box>
            </Box>
        </Box>
    </>
};

export default CommentBox;