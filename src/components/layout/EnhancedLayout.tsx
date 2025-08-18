import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Badge,
  Chip,
  Button,
  Divider,
  Tooltip,
  Alert,
  useTheme
} from '@mui/material';
import {
  Dashboard,
  People,
  Group,
  Assignment,
  CloudUpload,
  Business,
  History,
  Assessment,
  Settings,
  Menu,
  Notifications,
  SwapHoriz,
  PowerSettingsNew,
  CheckCircle,
  Warning
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

const drawerWidth = 280;

// Navigation items based on PowerShell tool structure
const navigationItems = [
  {
    section: 'Core Features',
    items: [
      { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard', description: 'Overview & Statistics' },
      { text: 'User Creation', icon: <People />, path: '/users', description: 'Single User Management' },
      { text: 'Groups', icon: <Group />, path: '/groups', description: 'Security & Distribution Groups' },
      { text: 'Licenses', icon: <Assignment />, path: '/licenses', description: 'M365 License Management' },
    ]
  },
  {
    section: 'Bulk Operations',
    items: [
      { text: 'Bulk Import', icon: <CloudUpload />, path: '/bulk-import', description: 'CSV Bulk User Creation' },
    ]
  },
  {
    section: 'Tenant Management',
    items: [
      { text: 'Tenant Data', icon: <Business />, path: '/tenant', description: 'Tenant Discovery & Info' },
      { text: 'Activity Log', icon: <History />, path: '/activity', description: 'Audit Trail & History' },
    ]
  },
  {
    section: 'Additional',
    items: [
      { text: 'Reports', icon: <Assessment />, path: '/reports', description: 'Analytics & Reports' },
      { text: 'Settings', icon: <Settings />, path: '/settings', description: 'Application Settings' },
    ]
  }
];

interface EnhancedLayoutProps {
  children: React.ReactNode;
}

const EnhancedLayout: React.FC<EnhancedLayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tenantConnected, setTenantConnected] = useState(true); // Mock connection status
  const [notificationOpen, setNotificationOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSwitchTenant = () => {
    // Mock tenant switching (like PowerShell Switch Tenant button)
    console.log('Switching tenant...');
    setTenantConnected(false);
    setTimeout(() => {
      setTenantConnected(true);
      console.log('Connected to new tenant: Contoso Corporation');
      // Could trigger re-authentication flow here
    }, 2000);
  };

  const handleDisconnect = () => {
    console.log('Disconnecting from tenant and logging out...');
    setTenantConnected(false);
    // In real implementation, this would:
    // 1. Clear authentication tokens
    // 2. Clear user session
    // 3. Redirect to login page
    // 4. Clear any cached tenant data
    setTimeout(() => {
      alert('Disconnected successfully. In a real app, you would be redirected to login.');
      // Could redirect to login page here
      // navigate('/login');
    }, 1000);
  };

  const handleNotificationClick = () => {
    setNotificationOpen(!notificationOpen);
    console.log('Notifications clicked - would show notification panel');
    // In real implementation, this would show a dropdown/panel with:
    // - Recent user creation activities  
    // - License assignment notifications
    // - Group membership changes
    // - System alerts and warnings
  };

  const TenantStatusChip = () => (
    <Chip
      icon={tenantConnected ? <CheckCircle /> : <Warning />}
      label={tenantConnected ? 'Contoso Corporation' : 'Disconnected'}
      color={tenantConnected ? 'success' : 'warning'}
      size="small"
      variant="outlined"
      sx={{ ml: 2 }}
    />
  );

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Tenant Status Header */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
          M365 User Provisioning
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Enterprise Edition v3.1
        </Typography>
        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
          <TenantStatusChip />
        </Box>
      </Box>

      {/* Connection Status Alert */}
      {!tenantConnected && (
        <Alert severity="warning" sx={{ m: 2, mb: 1 }}>
          Tenant disconnected. Switch tenant to reconnect.
        </Alert>
      )}

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        {navigationItems.map((section) => (
          <Box key={section.section} sx={{ mb: 2 }}>
            <Typography
              variant="overline"
              sx={{
                px: 2,
                py: 1,
                display: 'block',
                fontWeight: 600,
                color: 'text.secondary',
                fontSize: '0.75rem'
              }}
            >
              {section.section}
            </Typography>
            <List dense>
              {section.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                    <Tooltip title={item.description} placement="right">
                      <ListItemButton
                        selected={isActive}
                        onClick={() => navigate(item.path)}
                        sx={{
                          borderRadius: 1,
                          mx: 1,
                          '&.Mui-selected': {
                            backgroundColor: theme.palette.primary.main,
                            color: theme.palette.primary.contrastText,
                            '& .MuiListItemIcon-root': {
                              color: theme.palette.primary.contrastText,
                            },
                          },
                          '&:hover': {
                            backgroundColor: isActive 
                              ? theme.palette.primary.dark 
                              : theme.palette.action.hover,
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText 
                          primary={item.text}
                          primaryTypographyProps={{
                            fontSize: '0.875rem',
                            fontWeight: isActive ? 600 : 400
                          }}
                        />
                      </ListItemButton>
                    </Tooltip>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* Bottom Actions (like PowerShell tool buttons) */}
      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button
          variant="outlined"
          color="warning"
          startIcon={<SwapHoriz />}
          fullWidth
          onClick={handleSwitchTenant}
          sx={{ mb: 1 }}
          disabled={!tenantConnected}
        >
          Switch Tenant
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<PowerSettingsNew />}
          fullWidth
          size="small"
          onClick={handleDisconnect}
        >
          Disconnect
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Top App Bar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          borderBottom: `1px solid ${theme.palette.divider}`,
          boxShadow: 'none'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <Menu />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Microsoft 365 User Provisioning Tool
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Tenant Status for mobile */}
            <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
              <TenantStatusChip />
            </Box>

            {/* Notifications */}
            <Tooltip title="View notifications (3 new)">
              <IconButton 
                color="inherit"
                onClick={handleNotificationClick}
                sx={{ 
                  backgroundColor: notificationOpen ? 'action.selected' : 'transparent',
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
              >
                <Badge badgeContent={3} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Current User */}
            <Chip
              label="admin@contoso.com"
              color="primary"
              variant="outlined"
              size="small"
            />
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: `1px solid ${theme.palette.divider}`,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Toolbar /> {/* Spacer for fixed AppBar */}
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default EnhancedLayout;