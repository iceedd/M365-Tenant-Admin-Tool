import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, CircularProgress, Alert, Button } from '@mui/material';
import { Provider, useDispatch } from 'react-redux';
import { MsalProvider } from '@azure/msal-react';
import { store } from './store';
import { loginSuccess, loginFailure, logout } from './store/slices/authSlice';
import { getTheme } from './utils/theme';
import { createBrowserAuthService, AuthUser } from './services/authServiceBrowser';
import { validateAzureConfig } from './config/azureConfig';
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

// Configuration validation and setup
const configValidation = validateAzureConfig();
let authService: ReturnType<typeof createBrowserAuthService> | null = null;

try {
  if (configValidation.isValid) {
    authService = createBrowserAuthService();
  }
} catch (error) {
  console.error('Failed to initialize auth service:', error);
}

// Auth wrapper component
const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      if (!authService) {
        setAuthError('Azure AD configuration is invalid');
        setIsLoading(false);
        return;
      }

      try {
        // Check if user is already authenticated
        const isAuthenticated = await authService.isAuthenticated();
        if (isAuthenticated) {
          const currentUser = await authService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            dispatch(loginSuccess({
              user: {
                id: currentUser.id || '0',
                displayName: currentUser.displayName || 'Unknown User',
                userPrincipalName: currentUser.userPrincipalName || '',
                roles: currentUser.roles || ['user']
              },
              token: await authService.getAccessToken()
            }));
          }
        }
      } catch (error) {
        console.error('Failed to initialize authentication:', error);
        setAuthError(`Authentication initialization failed: ${error}`);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [dispatch]);

  const handleLogin = async () => {
    if (!authService) {
      setAuthError('Authentication service not available');
      return;
    }

    setIsLoading(true);
    setAuthError(null);

    try {
      const authResponse = await authService.loginPopup();
      setUser(authResponse.user);
      
      dispatch(loginSuccess({
        user: {
          id: authResponse.user.id || '0',
          displayName: authResponse.user.displayName || 'Unknown User',
          userPrincipalName: authResponse.user.userPrincipalName || '',
          roles: authResponse.user.roles || ['user']
        },
        token: authResponse.token
      }));
    } catch (error) {
      console.error('Login failed:', error);
      setAuthError(`Login failed: ${error}`);
      dispatch(loginFailure(error?.toString() || 'Unknown login error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!authService) return;

    try {
      await authService.logout();
      setUser(null);
      dispatch(logout());
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Configuration error screen
  if (!configValidation.isValid) {
    return (
      <Box sx={{ p: 4, maxWidth: 600, mx: 'auto', mt: 8 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <strong>Azure AD Configuration Error</strong>
        </Alert>
        <Box sx={{ mb: 2 }}>
          <p>The following configuration issues need to be resolved:</p>
          <ul>
            {configValidation.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Box>
        <Box sx={{ mb: 2 }}>
          <strong>Setup Instructions:</strong>
          <ol>
            <li>Copy <code>.env.example</code> to <code>.env.local</code></li>
            <li>Fill in your Azure AD application details</li>
            <li>See <code>AZURE_SETUP.md</code> for detailed instructions</li>
          </ol>
        </Box>
        <Alert severity="info">
          <strong>Development Mode:</strong> The app will continue to work with mock data for development purposes.
        </Alert>
      </Box>
    );
  }

  // Loading screen
  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        gap: 2
      }}>
        <CircularProgress />
        <Box sx={{ textAlign: 'center' }}>
          Connecting to Microsoft 365...
        </Box>
      </Box>
    );
  }

  // Login screen
  if (!user) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        gap: 3,
        p: 4
      }}>
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <h1>M365 Tenant Admin Tool</h1>
          <p>Please sign in with your Microsoft 365 account to continue</p>
        </Box>

        {authError && (
          <Alert severity="error" sx={{ maxWidth: 500, mb: 2 }}>
            {authError}
          </Alert>
        )}

        <Button 
          variant="contained" 
          size="large" 
          onClick={handleLogin}
          disabled={isLoading}
        >
          Sign in with Microsoft
        </Button>

        <Box sx={{ mt: 2, textAlign: 'center', fontSize: '0.875rem', color: 'text.secondary' }}>
          <p>You need appropriate permissions to manage Microsoft 365 users and groups.</p>
          <p>Contact your administrator if you don't have access.</p>
        </Box>
      </Box>
    );
  }

  // Authenticated app
  return (
    <Router>
      <EnhancedLayout onLogout={handleLogout}>
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
  );
};

const AppContent: React.FC = () => {
  const currentTheme = getTheme('light');

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <AuthWrapper>
        {/* App content will be rendered by AuthWrapper */}
      </AuthWrapper>
    </ThemeProvider>
  );
};

const App: React.FC = () => {
  // If MSAL is available, wrap with MsalProvider
  if (authService) {
    return (
      <MsalProvider instance={authService.getMsalInstance()}>
        <Provider store={store}>
          <AppContent />
        </Provider>
      </MsalProvider>
    );
  }

  // Fallback without MSAL (configuration error)
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
};

export default App;