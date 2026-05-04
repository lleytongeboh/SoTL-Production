import { Outlet } from "react-router-dom";
import { Box, Paper } from "@mui/material";
const LoginLayout = () => {
    return (
        <Box
            height={'100vh'}
            width={'100vw'}
            display="flex"
            alignItems="center"
            justifyContent="center"
            // bgcolor='background.default'
            className="bg-white"
            gap={4}
            p={8}
        >
            <Paper
                elevation={0}
                sx={{
                    padding: "2rem",
                    alignItems: "center",
                    justifyContent: "center"
                }}
            >
                <Outlet />
            </Paper>
        </Box>
    )
};

export default LoginLayout;