import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Provider, useDispatch } from 'react-redux';
import { store } from './store';
import { loginSuccess } from './store/slices/authSlice';
import { getTheme } from './utils/theme';
import EnhancedLayout from './components/layout/EnhancedLayout';
import EnhancedDashboard from './pages/EnhancedDashboard';
import EnhancedUsers from './pages/EnhancedUsers';
import TenantManagementSimple from './pages/TenantManagement-Simple';
import BulkImportSimple from './pages/BulkImport-Simple';
import LicenseManagementSimple from './pages/LicenseManagement-Simple';
import GroupManagementSimple from './pages/GroupManagement-Simple';
import ActivityManagementSimple from './pages/ActivityManagement-Simple';
import ReportsManagementSimple from './pages/ReportsManagement-Simple';
import SettingsManagementSimple from './pages/SettingsManagement-Simple';

// Simple working enhanced version
const DemoAutoLogin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Simple auto-login without complex types
    dispatch(loginSuccess({
      user: {
        id: '1',
        displayName: 'M365 Administrator',
        userPrincipalName: 'admin@contoso.com',
        roles: ['user', 'admin']
      } as any,
      token: 'demo-token-' + Date.now()
    }));
  }, [dispatch]);

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const currentTheme = getTheme('light');

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <DemoAutoLogin>
        <Router>
          <EnhancedLayout>
            <Routes>
              <Route path="/dashboard" element={<EnhancedDashboard />} />
              <Route path="/users" element={<EnhancedUsers />} />
              <Route path="/groups" element={<GroupManagementSimple />} />
              <Route path="/licenses" element={<LicenseManagementSimple />} />
              <Route path="/bulk-import" element={<BulkImportSimple />} />
              <Route path="/tenant" element={<TenantManagementSimple />} />
              <Route path="/activity" element={<ActivityManagementSimple />} />
              <Route path="/reports" element={<ReportsManagementSimple />} />
              <Route path="/reports/*" element={<ReportsManagementSimple />} />
              <Route path="/settings" element={<SettingsManagementSimple />} />
              <Route path="/settings/*" element={<SettingsManagementSimple />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </EnhancedLayout>
        </Router>
      </DemoAutoLogin>
    </ThemeProvider>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
};

export default App;