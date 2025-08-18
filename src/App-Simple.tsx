import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, Typography } from '@mui/material';
import { lightTheme } from './utils/theme';

// Simple demo dashboard for testing
const SimpleDashboard: React.FC = () => {
  return (
    <Box sx={{ p: 3, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Typography variant="h3" component="h1" gutterBottom>
        🎉 M365 User Provisioning Tool
      </Typography>
      <Typography variant="h5" color="text.secondary" gutterBottom>
        Application is running successfully!
      </Typography>
      
      <Box sx={{ mt: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          ✅ Frontend Status
        </Typography>
        <Typography>• React application loaded</Typography>
        <Typography>• Material-UI theme applied</Typography>
        <Typography>• Routing configured</Typography>
        <Typography>• Ready for Azure AD integration</Typography>
      </Box>

      <Box sx={{ mt: 3, p: 3, bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          🚀 Next Steps
        </Typography>
        <Typography>1. Configure Azure AD app registration</Typography>
        <Typography>2. Update .env file with your credentials</Typography>
        <Typography>3. Enable full authentication</Typography>
      </Box>
    </Box>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<SimpleDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;