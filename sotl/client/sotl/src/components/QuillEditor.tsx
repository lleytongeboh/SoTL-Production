import { FormHelperText } from '@mui/material';
import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface QuillTextEditorProps {
  text: string;
  setText: (text: string, withoutTag: string) => void;
  onBlur?: (text: string) => void;
  readonly?: boolean;
  toolbar?: boolean;
  border?: boolean;
  quillRef? : React.RefObject<ReactQuill>;
}

const QuillEditor = ({ text, setText, onBlur, readonly = false, toolbar = true, border = true, quillRef }: QuillTextEditorProps) => {
  const [error, setError] = React.useState<string | null>("");

  const maxHtmlSize = 2 * 1024 * 1024;

  const handleContentChange = (value: string, withoutTag: string) => {
    const blobSize = new Blob([value]).size;
    if (blobSize <= maxHtmlSize) {
      setText(value, withoutTag);
      setError("");
    } else {
      setError("The content is too large. Please limit the content to 2MB.");
    }
  };

  return (
    <>
      <ReactQuill
        className={border ? "" : "borderless-quill"}
        value={text}
        onChange={(value, _, __, editor) => {
          handleContentChange(value, editor.getText());
        }}
        onBlur={(_, __, editor) => {
          const currentContent = editor.getHTML(); // Get latest content
          onBlur && onBlur(currentContent);
        }}
        modules={{ toolbar: toolbar }}
        readOnly={readonly}
        ref={quillRef}
      />
      <FormHelperText sx={{ color: 'red' }}>{error}</FormHelperText>
    </>
  );
};

export default QuillEditor;