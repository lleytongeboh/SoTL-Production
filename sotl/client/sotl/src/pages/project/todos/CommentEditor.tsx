import { Box, Button } from "@mui/material";
import QuillEditor from "../../../components/QuillEditor";
import { useState } from "react";

interface CommentEditorProps {
    createCallback: (comment: string) => Promise<void>;
};

const CommentEditor: React.FC<CommentEditorProps> = ({ createCallback }) => {
    const [comment, setComment] = useState<string>("");
    const [isValid, setIsValid] = useState<boolean>(false);

    const handleCreate = () => {
        createCallback(comment);
        setComment("");
        setIsValid(false);
    };

    const handleCancel = () => {
        setComment("");
        setIsValid(false);
    };

    return (<>
        <b>Comment</b>
        <>
            <QuillEditor
                text={comment}
                setText={(text, withoutTag) => {
                    setComment(text);
                    setIsValid(withoutTag.length > 1);
                }}
            />
            <Box marginTop={'10px'} justifyContent={'end'} display={'flex'} gap={1}>
                <Button variant="contained" size="small" onClick={handleCreate} disabled={!isValid}>COMMENT</Button>
                <Button variant="outlined" size="small" onClick={handleCancel}>CANCEL</Button>
            </Box>
        </>
    </>);
}

export default CommentEditor;