import QuillEditor from "../../../components/QuillEditor";
import { Box, Chip } from "@mui/material";
import { projectHooks } from "../../../features/student/project/hooks/projectHooks";
import { useState } from "react";
import ReactQuill from "react-quill";

interface DescriptionEditorProps {
    readonly: boolean;
    selectedDescription: string;
    quillRef: React.RefObject<ReactQuill>;
};

const DescriptionEditor: React.FC<DescriptionEditorProps> = ({ readonly, selectedDescription, quillRef }) => {
    const { identifyImages } = projectHooks();

    const { newImages } = identifyImages(selectedDescription);
    const [description, setDescription] = useState<string>(selectedDescription);

    return (
        <>
            <b>Description</b>
            <QuillEditor
                text={description ?? ''}
                setText={(text) => setDescription(text)}
                readonly={readonly}
                quillRef={quillRef}
            />
            {newImages.length > 0 && (
                <Box marginTop={1}>
                    <Box display={'flex'} gap={1}>
                        <b>Attachments</b>
                        <Chip label={newImages.length} size="small"></Chip>
                    </Box>
                    <Box display={'flex'} gap={1}>
                        {newImages.map((image, index) => (
                            <Box
                                key={index}
                                borderRadius={2}
                                boxShadow={2}
                                maxWidth={200}
                                maxHeight={150}
                                overflow={"clip"}
                            >
                                <img
                                    style={{ height: 150, width: 200, objectFit: 'cover' }}
                                    src={image}
                                    alt={"image" + index}
                                />
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}
        </>
    );
};

export default DescriptionEditor;