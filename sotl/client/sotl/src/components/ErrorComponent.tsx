import { ErrorOutline } from "@mui/icons-material";
import { Box } from "@mui/material";

interface ErrorComponentProps {
    message: string;
}

const ErrorComponent: React.FC<ErrorComponentProps> = ({ message }) => {
    return <Box>
        <h1>Opps! An Error Appeared</h1>
        <ErrorOutline />
        <h4>Error: {message}</h4>
        <h4>Contact Admin For More Information</h4>
    </Box>

};

export default ErrorComponent;