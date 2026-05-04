import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            main: '#1A00BD',
        },
        // Optionally set secondary color or other palette options
        secondary: {
            main: '#FF5722', // Example secondary color
        },
    },
    typography: {
        fontFamily: 'Kumbh Sans, Arial, sans-serif',
    },
    // Add other theme customizations here
});

export default theme;
