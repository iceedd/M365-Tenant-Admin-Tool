import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Provider } from 'react-redux';
import { store } from './store';
import { useSelector } from 'react-redux';
import { RootState } from './store';
import { getTheme } from './utils/theme';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginForm from './components/auth/LoginForm';
import OAuthCallback from './components/auth/OAuthCallback';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Groups from './pages/Groups';
import Licenses from './pages/Licenses';

const AppContent: React.FC = () => {
  const { theme } = useSelector((state: RootState) => state.ui);
  const currentTheme = getTheme(theme);

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Authentication Routes */}
          <Route path="/login" element={<LoginForm />} />
          <Route path="/auth/callback" element={<OAuthCallback />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/users" element={
            <ProtectedRoute>
              <Layout>
                <Users />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/groups" element={
            <ProtectedRoute>
              <Layout>
                <Groups />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/licenses" element={
            <ProtectedRoute>
              <Layout>
                <Licenses />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Placeholder routes for future implementation */}
          <Route path="/reports/*" element={
            <ProtectedRoute>
              <Layout>
                <div>Reports - Coming Soon</div>
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/*" element={
            <ProtectedRoute requiredRoles={['admin']}>
              <Layout>
                <div>Administration - Coming Soon</div>
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
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