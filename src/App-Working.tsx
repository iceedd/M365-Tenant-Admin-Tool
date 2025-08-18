import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Card, CardContent, Grid, Paper } from '@mui/material';
import { Dashboard as DashboardIcon, People, Group, Assignment } from '@mui/icons-material';
import { lightTheme } from './utils/theme';

const drawerWidth = 240;

// Simple Dashboard Component
const SimpleDashboard: React.FC = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h4" gutterBottom>Dashboard</Typography>
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Total Users</Typography>
            <Typography variant="h4">1,234</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Active Groups</Typography>
            <Typography variant="h4">56</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Licenses Used</Typography>
            <Typography variant="h4">890</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Available Licenses</Typography>
            <Typography variant="h4">110</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </Box>
);

// Simple Users Component
const SimpleUsers: React.FC = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h4" gutterBottom>Users</Typography>
    <Paper sx={{ p: 2 }}>
      <Typography>User management interface coming soon...</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        This will include user creation, editing, and Microsoft 365 license assignment.
      </Typography>
    </Paper>
  </Box>
);

// Simple Groups Component
const SimpleGroups: React.FC = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h4" gutterBottom>Groups</Typography>
    <Paper sx={{ p: 2 }}>
      <Typography>Group management interface coming soon...</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        This will include security group and Microsoft 365 group management.
      </Typography>
    </Paper>
  </Box>
);

// Simple Licenses Component
const SimpleLicenses: React.FC = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h4" gutterBottom>Licenses</Typography>
    <Paper sx={{ p: 2 }}>
      <Typography>License management interface coming soon...</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        This will include Office 365 license tracking and assignment.
      </Typography>
    </Paper>
  </Box>
);

// Navigation items
const navItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Users', icon: <People />, path: '/users' },
  { text: 'Groups', icon: <Group />, path: '/groups' },
  { text: 'Licenses', icon: <Assignment />, path: '/licenses' },
];

// Main Layout Component
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            M365 User Provisioning Tool
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {navItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton component="a" href={item.path}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <Router>
        <Layout>
          <Routes>
            <Route path="/dashboard" element={<SimpleDashboard />} />
            <Route path="/users" element={<SimpleUsers />} />
            <Route path="/groups" element={<SimpleGroups />} />
            <Route path="/licenses" element={<SimpleLicenses />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
};

export default App;