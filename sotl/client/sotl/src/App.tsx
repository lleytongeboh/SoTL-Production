import './assets/css/App.css';
import theme from './assets/theme';
import { ThemeProvider } from '@mui/material/styles';
import AppRoutes from './routes/AppRoutes';
import Chatbox from './components/Chatbox';
import React from 'react';

const App: React.FC = () => {
  // 🚀 Debug log — confirms App.tsx is being used by Vite
  console.log("🚀 App.tsx is running (this should appear in the browser console)");

  return (
    <ThemeProvider theme={theme}>
      <AppRoutes />
      <Chatbox />
    </ThemeProvider>
  );
};

export default App;
