import React, { useState, useEffect } from 'react';
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
  useTheme,
  Menu as MuiMenu,
  MenuItem,
  Paper,
  Popover
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
  Warning,
  Close
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
  onLogout?: () => void;
  user?: {
    name?: string;
    email?: string;
  };
}

const EnhancedLayout: React.FC<EnhancedLayoutProps> = ({ children, onLogout, user }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tenantConnected, setTenantConnected] = useState(true);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationAnchor, setNotificationAnchor] = useState<HTMLElement | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();

  // Initialize with empty notifications - will be populated from API
  useEffect(() => {
    // In a real implementation, fetch notifications from the API
    setNotifications([]);
    
    // Example of how to fetch notifications:
    // async function fetchNotifications() {
    //   try {
    //     const response = await fetch('/api/notifications');
    //     const data = await response.json();
    //     if (data.success) {
    //       setNotifications(data.data);
    //     }
    //   } catch (error) {
    //     console.error('Failed to fetch notifications:', error);
    //   }
    // }
    // fetchNotifications();
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSwitchTenant = () => {
    console.log('🔄 Switching to different tenant...');
    setTenantConnected(false);
    
    // Force a new login to switch tenants
    if (onLogout) {
      setTimeout(() => {
        console.log('🔄 Triggering re-authentication for tenant switch...');
        onLogout(); // This will clear current session and show login screen
      }, 1500);
    }
  };

  const handleDisconnect = () => {
    console.log('🔌 Disconnecting from tenant and logging out...');
    setTenantConnected(false);
    
    // Actually perform logout
    if (onLogout) {
      setTimeout(() => {
        console.log('🔌 Performing real logout...');
        onLogout(); // This will clear authentication and show login screen
      }, 1000);
    } else {
      setTimeout(() => {
        alert('Disconnected successfully. You will be redirected to login.');
        window.location.reload(); // Fallback if no logout handler
      }, 1000);
    }
  };

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    console.log('🔔 Opening notifications panel...');
    setNotificationAnchor(event.currentTarget);
    setNotificationOpen(!notificationOpen);
  };

  const handleCloseNotifications = () => {
    setNotificationAnchor(null);
    setNotificationOpen(false);
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const TenantStatusChip = () => (
    <Chip
      icon={tenantConnected ? <CheckCircle /> : <Warning />}
      label={tenantConnected ? 'Connected' : 'Disconnected'}
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
            <Tooltip title={`View notifications (${notifications.length} new)`}>
              <IconButton 
                color="inherit"
                onClick={handleNotificationClick}
                sx={{ 
                  backgroundColor: notificationOpen ? 'action.selected' : 'transparent',
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
              >
                <Badge badgeContent={notifications.length} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Current User */}
            <Chip
              label={user?.email || "Signed In"}
              color="primary"
              variant="outlined"
              size="small"
            />
          </Box>
        </Toolbar>
      </AppBar>

      {/* Notifications Popover */}
      <Popover
        open={notificationOpen}
        anchorEl={notificationAnchor}
        onClose={handleCloseNotifications}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Paper sx={{ width: 350, maxHeight: 400 }}>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Notifications
              </Typography>
              <IconButton size="small" onClick={handleCloseNotifications}>
                <Close />
              </IconButton>
            </Box>
          </Box>
          <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <Box
                  key={notification.id}
                  sx={{
                    p: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 'none' },
                    '&:hover': { backgroundColor: 'action.hover' }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Box sx={{ mt: 0.5 }}>
                      {notification.type === 'success' && <CheckCircle sx={{ color: 'success.main', fontSize: 16 }} />}
                      {notification.type === 'warning' && <Warning sx={{ color: 'warning.main', fontSize: 16 }} />}
                      {notification.type === 'info' && <Notifications sx={{ color: 'info.main', fontSize: 16 }} />}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTimeAgo(notification.timestamp)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Notifications sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No new notifications
                </Typography>
              </Box>
            )}
          </Box>
          {notifications.length > 0 && (
            <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Button
                fullWidth
                variant="text"
                size="small"
                onClick={() => {
                  setNotifications([]);
                  handleCloseNotifications();
                }}
              >
                Clear All Notifications
              </Button>
            </Box>
          )}
        </Paper>
      </Popover>

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