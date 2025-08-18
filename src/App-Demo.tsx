import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Provider, useDispatch } from 'react-redux';
import { store } from './store';
import { loginSuccess } from './store/slices/authSlice';
import { getTheme } from './utils/theme';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Groups from './pages/Groups';
import Licenses from './pages/Licenses';

// Auto-login component for demo mode
const DemoAutoLogin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Auto-login with demo user
    dispatch(loginSuccess({
      user: {
        id: '1',
        displayName: 'Demo User',
        userPrincipalName: 'demo@company.com',
        roles: ['user', 'admin'],
        department: 'IT',
        jobTitle: 'Administrator'
      },
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
          <Layout>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/users" element={<Users />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/licenses" element={<Licenses />} />
              
              {/* Placeholder routes */}
              <Route path="/reports/*" element={<div>Reports - Coming Soon</div>} />
              <Route path="/admin/*" element={<div>Administration - Coming Soon</div>} />
              
              {/* Redirects */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Layout>
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