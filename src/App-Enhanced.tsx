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
import EnhancedGroups from './pages/EnhancedGroups';
import EnhancedLicenses from './pages/EnhancedLicenses';
import TenantManagement from './pages/TenantManagement';
import BulkImport from './pages/BulkImport';
import ActivityLogs from './pages/ActivityLogs';

// Auto-login component for demo mode (enhanced with tenant data)
const DemoAutoLogin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Auto-login with enhanced demo user and tenant data
    dispatch(loginSuccess({
      user: {
        id: '1',
        displayName: 'M365 Administrator',
        userPrincipalName: 'admin@contoso.com',
        roles: ['user', 'admin', 'global-admin'],
        tenantId: 'contoso-tenant-123',
        tenantName: 'Contoso Corporation',
        department: 'IT',
        jobTitle: 'M365 Administrator',
        permissions: [
          { scope: 'https://graph.microsoft.com/', permission: 'User.ReadWrite.All', granted: true },
          { scope: 'https://graph.microsoft.com/', permission: 'Group.ReadWrite.All', granted: true },
          { scope: 'https://graph.microsoft.com/', permission: 'Directory.ReadWrite.All', granted: true }
        ]
      },
      token: 'demo-token-' + Date.now()
    }));
    
    // Set mock tenant connection
    localStorage.setItem('mock-tenant-connected', 'true');
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
              {/* Main navigation pages (based on PowerShell tool tabs) */}
              <Route path="/dashboard" element={<EnhancedDashboard />} />
              <Route path="/users" element={<EnhancedUsers />} />
              <Route path="/groups" element={<EnhancedGroups />} />
              <Route path="/licenses" element={<EnhancedLicenses />} />
              
              {/* Enhanced features from PowerShell tool */}
              <Route path="/bulk-import" element={<BulkImport />} />
              <Route path="/tenant" element={<TenantManagement />} />
              <Route path="/activity" element={<ActivityLogs />} />
              
              {/* Future features */}
              <Route path="/reports/*" element={<div>Reports - Coming Soon</div>} />
              <Route path="/settings/*" element={<div>Settings - Coming Soon</div>} />
              
              {/* Redirects */}
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