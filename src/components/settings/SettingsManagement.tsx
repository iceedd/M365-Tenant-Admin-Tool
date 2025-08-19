import React, { useState, useEffect } from 'react';
import {
  useGetUserPreferencesQuery,
  useUpdateUserPreferencesMutation,
  useGetTenantSettingsQuery,
  useUpdateTenantSettingsMutation,
  useGetSecurityOverviewQuery,
  useGetAdminUsersQuery,
  useAddAdminUserMutation,
  useRemoveAdminUserMutation
} from '../../store/api/settingsApi';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Tabs,
  Tab,
  Switch,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  RadioGroup,
  Radio,
  FormLabel,
  Checkbox,
  Snackbar
} from '@mui/material';
import {
  Settings,
  Person,
  Security,
  Business,
  Notifications,
  Palette,
  Language,
  Storage,
  Shield,
  VpnKey,
  AdminPanelSettings,
  Group,
  Assignment,
  Email,
  CloudSync,
  Schedule,
  Backup,
  Update,
  BugReport,
  Help,
  Info,
  Save,
  Refresh,
  Edit,
  Delete,
  Add,
  ExpandMore,
  Warning,
  CheckCircle,
  Error,
  Visibility,
  VisibilityOff,
  Download,
  Upload,
  RestartAlt,
  SettingsBackupRestore
} from '@mui/icons-material';

// Settings data interfaces
interface UserPreference {
  id: string;
  category: string;
  name: string;
  description: string;
  value: any;
  type: 'boolean' | 'string' | 'number' | 'select' | 'slider';
  options?: string[];
  min?: number;
  max?: number;
}

interface TenantSetting {
  id: string;
  category: string;
  name: string;
  description: string;
  value: any;
  type: 'boolean' | 'string' | 'number' | 'select';
  options?: string[];
  requiresRestart?: boolean;
  securityLevel: 'low' | 'medium' | 'high';
}

interface AdminUser {
  id: string;
  displayName: string;
  userPrincipalName: string;
  roles: string[];
  lastActive: string;
  status: 'active' | 'inactive';
  permissions: string[];
}

// Mock settings data
const userPreferences: UserPreference[] = [
  {
    id: 'theme',
    category: 'Appearance',
    name: 'Theme',
    description: 'Choose your preferred color theme',
    value: 'light',
    type: 'select',
    options: ['light', 'dark', 'auto']
  },
  {
    id: 'language',
    category: 'Localization',
    name: 'Language',
    description: 'Interface language preference',
    value: 'en-US',
    type: 'select',
    options: ['en-US', 'en-GB', 'fr-FR', 'de-DE', 'es-ES']
  },
  {
    id: 'timezone',
    category: 'Localization',
    name: 'Timezone',
    description: 'Your local timezone for date/time display',
    value: 'UTC',
    type: 'select',
    options: ['UTC', 'America/New_York', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo']
  },
  {
    id: 'notifications',
    category: 'Notifications',
    name: 'Email Notifications',
    description: 'Receive email notifications for important events',
    value: true,
    type: 'boolean'
  },
  {
    id: 'realTimeUpdates',
    category: 'Performance',
    name: 'Real-time Updates',
    description: 'Enable live data updates and notifications',
    value: true,
    type: 'boolean'
  },
  {
    id: 'autoRefresh',
    category: 'Performance',
    name: 'Auto Refresh Interval',
    description: 'Automatic data refresh interval in minutes',
    value: 5,
    type: 'slider',
    min: 1,
    max: 60
  },
  {
    id: 'pageSize',
    category: 'Display',
    name: 'Items per Page',
    description: 'Number of items to display in tables and lists',
    value: 25,
    type: 'select',
    options: ['10', '25', '50', '100']
  }
];

const tenantSettings: TenantSetting[] = [
  {
    id: 'defaultLicense',
    category: 'User Management',
    name: 'Default License Type',
    description: 'Default license assigned to new users',
    value: 'Microsoft 365 E3',
    type: 'select',
    options: ['Microsoft 365 E3', 'Microsoft 365 E5', 'Microsoft 365 Business Premium'],
    securityLevel: 'medium'
  },
  {
    id: 'passwordPolicy',
    category: 'Security',
    name: 'Enforce Strong Passwords',
    description: 'Require complex passwords for all users',
    value: true,
    type: 'boolean',
    securityLevel: 'high'
  },
  {
    id: 'mfaRequired',
    category: 'Security',
    name: 'Require Multi-Factor Authentication',
    description: 'Force MFA for all user accounts',
    value: true,
    type: 'boolean',
    securityLevel: 'high'
  },
  {
    id: 'sessionTimeout',
    category: 'Security',
    name: 'Session Timeout (hours)',
    description: 'Automatically log out inactive users',
    value: 8,
    type: 'number',
    securityLevel: 'medium'
  },
  {
    id: 'auditRetention',
    category: 'Compliance',
    name: 'Audit Log Retention (days)',
    description: 'How long to keep audit logs',
    value: 90,
    type: 'number',
    securityLevel: 'high'
  },
  {
    id: 'guestAccess',
    category: 'Access Control',
    name: 'Allow Guest Users',
    description: 'Enable external user collaboration',
    value: false,
    type: 'boolean',
    securityLevel: 'high'
  },
  {
    id: 'autoProvision',
    category: 'Automation',
    name: 'Auto-Provision New Users',
    description: 'Automatically create user accounts from HR system',
    value: false,
    type: 'boolean',
    requiresRestart: true,
    securityLevel: 'medium'
  }
];

const adminUsers: AdminUser[] = [
  {
    id: '1',
    displayName: 'Sarah Wilson',
    userPrincipalName: 'sarah.wilson@contoso.com',
    roles: ['Global Administrator', 'User Administrator'],
    lastActive: '2025-08-17T14:30:00Z',
    status: 'active',
    permissions: ['read', 'write', 'delete', 'admin']
  },
  {
    id: '2',
    displayName: 'Mike Johnson',
    userPrincipalName: 'mike.johnson@contoso.com',
    roles: ['User Administrator', 'Group Administrator'],
    lastActive: '2025-08-17T12:15:00Z',
    status: 'active',
    permissions: ['read', 'write']
  },
  {
    id: '3',
    displayName: 'David Brown',
    userPrincipalName: 'david.brown@contoso.com',
    roles: ['Helpdesk Administrator'],
    lastActive: '2025-08-16T16:45:00Z',
    status: 'active',
    permissions: ['read']
  }
];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

const SettingsManagement: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [userPrefs, setUserPrefs] = useState(userPreferences);
  const [tenantSettings_, setTenantSettings] = useState(tenantSettings);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(false);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [adminUsers_, setAdminUsers] = useState<any[]>([]);
  
  // Fetch data using API
  const { data: userPreferencesData, isLoading: isLoadingPreferences } = 
    useGetUserPreferencesQuery(undefined, { refetchOnMountOrArgChange: true });
  
  const { data: tenantSettingsData, isLoading: isLoadingTenantSettings } = 
    useGetTenantSettingsQuery(undefined, { refetchOnMountOrArgChange: true });
  
  const { data: securityOverviewData, isLoading: isLoadingSecurityOverview } = 
    useGetSecurityOverviewQuery(undefined, { refetchOnMountOrArgChange: true });
  
  const { data: adminUsersData, isLoading: isLoadingAdminUsers } = 
    useGetAdminUsersQuery(undefined, { refetchOnMountOrArgChange: true });
  
  // Mutations
  const [updateUserPreferences, { isLoading: isUpdatingPreferences }] = 
    useUpdateUserPreferencesMutation();
  
  const [updateTenantSettings, { isLoading: isUpdatingTenantSettings }] = 
    useUpdateTenantSettingsMutation();
  
  const [addAdminUser, { isLoading: isAddingAdmin }] = 
    useAddAdminUserMutation();
  
  const [removeAdminUser, { isLoading: isRemovingAdmin }] = 
    useRemoveAdminUserMutation();
  
  // Initialize state from API data
  useEffect(() => {
    if (userPreferencesData) {
      setUserPrefs(userPreferencesData);
    }
  }, [userPreferencesData]);
  
  useEffect(() => {
    if (tenantSettingsData) {
      setTenantSettings(tenantSettingsData);
    }
  }, [tenantSettingsData]);
  
  useEffect(() => {
    if (adminUsersData) {
      setAdminUsers(adminUsersData);
    }
  }, [adminUsersData]);
  const [newAdmin, setNewAdmin] = useState({
    displayName: '',
    userPrincipalName: '',
    roles: [] as string[]
  });

  const handleUserPrefChange = (id: string, newValue: any) => {
    setUserPrefs(prev => prev.map(pref => 
      pref.id === id ? { ...pref, value: newValue } : pref
    ));
    setPendingChanges(true);
  };

  const handleTenantSettingChange = (id: string, newValue: any) => {
    setTenantSettings(prev => prev.map(setting => 
      setting.id === id ? { ...setting, value: newValue } : setting
    ));
    setPendingChanges(true);
  };

  const handleSaveSettings = async () => {
    try {
      // Save both user preferences and tenant settings
      await Promise.all([
        updateUserPreferences(userPrefs).unwrap(),
        updateTenantSettings(tenantSettings_).unwrap()
      ]);
      
      console.log('User Preferences saved:', userPrefs);
      console.log('Tenant Settings saved:', tenantSettings_);
      
      setPendingChanges(false);
      setShowSaveSuccess(true);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const handleResetSettings = () => {
    setUserPrefs(userPreferences);
    setTenantSettings(tenantSettings);
    setPendingChanges(false);
  };

  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getSecurityLevelIcon = (level: string) => {
    switch (level) {
      case 'high': return <Shield color="error" />;
      case 'medium': return <Warning color="warning" />;
      case 'low': return <CheckCircle color="success" />;
      default: return <Info />;
    }
  };

  const handleAddAdmin = async () => {
    try {
      if (!newAdmin.displayName || !newAdmin.userPrincipalName || newAdmin.roles.length === 0) {
        console.log('Please fill in all required fields');
        return;
      }

      // Call the API to add admin
      const result = await addAdminUser({
        displayName: newAdmin.displayName,
        userPrincipalName: newAdmin.userPrincipalName,
        roles: newAdmin.roles
      }).unwrap();

      // Reset form
      setNewAdmin({
        displayName: '',
        userPrincipalName: '',
        roles: []
      });
      setShowAdminDialog(false);

      console.log('Administrator added successfully:', result.user);
    } catch (error) {
      console.error('Failed to add administrator:', error);
    }
  };

  const handleRemoveAdmin = async (adminId: string) => {
    try {
      // Call the API to remove admin
      await removeAdminUser(adminId).unwrap();
      
      // Update local state
      setAdminUsers_(prev => prev.filter(admin => admin.id !== adminId));
      console.log('Administrator removed:', adminId);
    } catch (error) {
      console.error('Failed to remove administrator:', error);
    }
  };

  const renderUserPreferenceSetting = (pref: UserPreference) => {
    return (
      <ListItem key={pref.id}>
        <ListItemText
          primary={pref.name}
          secondary={pref.description}
        />
        <ListItemSecondaryAction>
          {pref.type === 'boolean' && (
            <Switch
              checked={pref.value}
              onChange={(e) => handleUserPrefChange(pref.id, e.target.checked)}
            />
          )}
          {pref.type === 'select' && (
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={pref.value}
                onChange={(e) => handleUserPrefChange(pref.id, e.target.value)}
              >
                {pref.options?.map(option => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {pref.type === 'slider' && (
            <Box sx={{ width: 200, px: 2 }}>
              <Slider
                value={pref.value}
                onChange={(_, value) => handleUserPrefChange(pref.id, value)}
                min={pref.min}
                max={pref.max}
                valueLabelDisplay="auto"
                marks={[
                  { value: pref.min!, label: `${pref.min}` },
                  { value: pref.max!, label: `${pref.max}` }
                ]}
              />
            </Box>
          )}
        </ListItemSecondaryAction>
      </ListItem>
    );
  };

  const renderTenantSetting = (setting: TenantSetting) => {
    return (
      <ListItem key={setting.id}>
        <ListItemIcon>
          {getSecurityLevelIcon(setting.securityLevel)}
        </ListItemIcon>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {setting.name}
              <Chip
                label={setting.securityLevel.toUpperCase()}
                size="small"
                color={getSecurityLevelColor(setting.securityLevel) as any}
              />
              {setting.requiresRestart && (
                <Chip label="RESTART REQUIRED" size="small" color="warning" />
              )}
            </Box>
          }
          secondary={setting.description}
        />
        <ListItemSecondaryAction>
          {setting.type === 'boolean' && (
            <Switch
              checked={setting.value}
              onChange={(e) => handleTenantSettingChange(setting.id, e.target.checked)}
            />
          )}
          {setting.type === 'select' && (
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select
                value={setting.value}
                onChange={(e) => handleTenantSettingChange(setting.id, e.target.value)}
              >
                {setting.options?.map(option => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {setting.type === 'number' && (
            <TextField
              type="number"
              value={setting.value}
              onChange={(e) => handleTenantSettingChange(setting.id, parseInt(e.target.value))}
              size="small"
              sx={{ width: 100 }}
            />
          )}
        </ListItemSecondaryAction>
      </ListItem>
    );
  };

  // Group settings by category
  const groupedUserPrefs = userPrefs.reduce((acc, pref) => {
    if (!acc[pref.category]) acc[pref.category] = [];
    acc[pref.category].push(pref);
    return acc;
  }, {} as Record<string, UserPreference[]>);

  const groupedTenantSettings = tenantSettings_.reduce((acc, setting) => {
    if (!acc[setting.category]) acc[setting.category] = [];
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, TenantSetting[]>);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Settings & Configuration
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {pendingChanges && (
            <Button
              variant="outlined"
              startIcon={<RestartAlt />}
              onClick={handleResetSettings}
            >
              Reset Changes
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSaveSettings}
            disabled={!pendingChanges}
          >
            Save Settings
          </Button>
        </Box>
      </Box>

      {pendingChanges && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You have unsaved changes. Click "Save Settings" to apply them.
        </Alert>
      )}

      {/* Settings Tabs */}
      <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)} sx={{ mb: 2 }}>
        <Tab label="User Preferences" icon={<Person />} />
        <Tab label="Tenant Settings" icon={<Business />} />
        <Tab label="Security & Compliance" icon={<Security />} />
        <Tab label="Admin Users" icon={<AdminPanelSettings />} />
      </Tabs>

      <TabPanel value={currentTab} index={0}>
        {/* User Preferences */}
        <Grid container spacing={3}>
          {Object.entries(groupedUserPrefs).map(([category, prefs]) => (
            <Grid item xs={12} md={6} key={category}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                    {category === 'Appearance' && <Palette sx={{ mr: 1 }} />}
                    {category === 'Localization' && <Language sx={{ mr: 1 }} />}
                    {category === 'Notifications' && <Notifications sx={{ mr: 1 }} />}
                    {category === 'Performance' && <CloudSync sx={{ mr: 1 }} />}
                    {category === 'Display' && <Settings sx={{ mr: 1 }} />}
                    {category}
                  </Typography>
                  <List>
                    {prefs.map((pref, index) => (
                      <React.Fragment key={pref.id}>
                        {renderUserPreferenceSetting(pref)}
                        {index < prefs.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        {/* Tenant Settings */}
        <Grid container spacing={3}>
          {Object.entries(groupedTenantSettings).map(([category, settings]) => (
            <Grid item xs={12} key={category}>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                    {category === 'User Management' && <Person sx={{ mr: 1 }} />}
                    {category === 'Security' && <Security sx={{ mr: 1 }} />}
                    {category === 'Compliance' && <Shield sx={{ mr: 1 }} />}
                    {category === 'Access Control' && <VpnKey sx={{ mr: 1 }} />}
                    {category === 'Automation' && <Settings sx={{ mr: 1 }} />}
                    {category} ({settings.length} settings)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List>
                    {settings.map((setting, index) => (
                      <React.Fragment key={setting.id}>
                        {renderTenantSetting(setting)}
                        {index < settings.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        {/* Security & Compliance */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                  <Shield sx={{ mr: 1 }} />
                  Security Overview
                </Typography>
                {isLoadingSecurityOverview ? (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography>Loading security data...</Typography>
                  </Box>
                ) : securityOverviewData ? (
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle color={securityOverviewData.multiFactorAuth.complianceRate > 90 ? "success" : "warning"} />
                      </ListItemIcon>
                      <ListItemText
                        primary="Multi-Factor Authentication"
                        secondary={`${securityOverviewData.multiFactorAuth.complianceRate.toFixed(1)}% compliance rate (${securityOverviewData.multiFactorAuth.enabledCount}/${securityOverviewData.multiFactorAuth.totalCount} users)`}
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemIcon>
                        <Warning color={securityOverviewData.passwordPolicy.complianceRate > 90 ? "success" : "warning"} />
                      </ListItemIcon>
                      <ListItemText
                        primary="Password Policy Compliance"
                        secondary={`${securityOverviewData.passwordPolicy.complianceRate.toFixed(1)}% of users have strong passwords`}
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemIcon>
                        <Error color={securityOverviewData.guestUsers.reviewRate < 10 ? "success" : "error"} />
                      </ListItemIcon>
                      <ListItemText
                        primary="Guest User Reviews"
                        secondary={`${securityOverviewData.guestUsers.reviewRate.toFixed(1)}% of guest users need access review`}
                      />
                    </ListItem>
                  </List>
                ) : (
                  <Alert severity="info">
                    No security data available. Connect to a tenant to view security information.
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                  <Storage sx={{ mr: 1 }} />
                  System Information
                </Typography>
                {isLoadingSecurityOverview ? (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography>Loading system information...</Typography>
                  </Box>
                ) : securityOverviewData?.systemInfo ? (
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Application Version"
                        secondary={`${securityOverviewData.systemInfo.appVersion} ${securityOverviewData.systemInfo.isUpToDate ? '(Latest)' : '(Update Available)'}`}
                      />
                      <ListItemSecondaryAction>
                        <Chip 
                          label={securityOverviewData.systemInfo.isUpToDate ? "UP TO DATE" : "UPDATE AVAILABLE"} 
                          size="small" 
                          color={securityOverviewData.systemInfo.isUpToDate ? "success" : "warning"} 
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText
                        primary="Database Version"
                        secondary={securityOverviewData.systemInfo.databaseVersion}
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText
                        primary="Last Backup"
                        secondary={new Date(securityOverviewData.systemInfo.lastBackup).toLocaleString()}
                      />
                      <ListItemSecondaryAction>
                        <IconButton>
                          <Backup />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                ) : (
                  <Alert severity="info">
                    No system information available.
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                  <Schedule sx={{ mr: 1 }} />
                  Maintenance & Updates
                </Typography>
                {securityOverviewData?.systemInfo ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  System maintenance is scheduled for {new Date(securityOverviewData.systemInfo.nextMaintenance).toLocaleString()} (approximately 2 hours).
                </Alert>
              ) : (
                <Alert severity="info" sx={{ mb: 2 }}>
                  No scheduled maintenance information available.
                </Alert>
              )}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button variant="outlined" startIcon={<Download />}>
                    Download Logs
                  </Button>
                  <Button variant="outlined" startIcon={<SettingsBackupRestore />}>
                    Backup Settings
                  </Button>
                  <Button variant="outlined" startIcon={<Update />}>
                    Check for Updates
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={currentTab} index={3}>
        {/* Admin Users */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <AdminPanelSettings sx={{ mr: 1 }} />
                Administrator Accounts
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setShowAdminDialog(true)}
              >
                Add Administrator
              </Button>
            </Box>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Roles</TableCell>
                    <TableCell>Last Active</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoadingAdminUsers ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Box sx={{ p: 2, textAlign: 'center' }}>
                          <Typography>Loading administrators...</Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : adminUsers_.length > 0 ? adminUsers_.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                            {user.displayName.charAt(0)}
                          </Avatar>
                          <Typography variant="body2" fontWeight="medium">
                            {user.displayName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{user.userPrincipalName}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {user.roles.map((role, index) => (
                            <Chip
                              key={index}
                              label={role}
                              size="small"
                              color={role.includes('Global') ? 'error' : 'primary'}
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(user.lastActive).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.status.toUpperCase()}
                          size="small"
                          color={user.status === 'active' ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small">
                          <Edit />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleRemoveAdmin(user.id)}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Box sx={{ p: 2 }}>
                          <Alert severity="info">
                            No administrators found. Add a new administrator to get started.
                          </Alert>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Add Administrator Dialog */}
      <Dialog 
        open={showAdminDialog} 
        onClose={() => setShowAdminDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AdminPanelSettings sx={{ mr: 1 }} />
            Add New Administrator
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            <TextField
              label="Display Name *"
              fullWidth
              value={newAdmin.displayName}
              onChange={(e) => setNewAdmin(prev => ({ ...prev, displayName: e.target.value }))}
              placeholder="e.g., John Smith"
            />
            <TextField
              label="Email Address *"
              fullWidth
              value={newAdmin.userPrincipalName}
              onChange={(e) => setNewAdmin(prev => ({ ...prev, userPrincipalName: e.target.value }))}
              placeholder="e.g., john.smith@contoso.com"
              type="email"
            />
            <FormControl fullWidth>
              <InputLabel>Administrative Roles *</InputLabel>
              <Select
                multiple
                value={newAdmin.roles}
                onChange={(e) => setNewAdmin(prev => ({ ...prev, roles: e.target.value as string[] }))}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip 
                        key={value} 
                        label={value} 
                        size="small"
                        color={value.includes('Global') ? 'error' : 'primary'}
                      />
                    ))}
                  </Box>
                )}
              >
                {/* Most Common Administrative Roles */}
                <MenuItem value="Global Administrator">Global Administrator</MenuItem>
                <MenuItem value="User Administrator">User Administrator</MenuItem>
                <MenuItem value="Privileged Role Administrator">Privileged Role Administrator</MenuItem>
                
                {/* Identity & Access Management */}
                <MenuItem value="Application Administrator">Application Administrator</MenuItem>
                <MenuItem value="Application Developer">Application Developer</MenuItem>
                <MenuItem value="Authentication Administrator">Authentication Administrator</MenuItem>
                <MenuItem value="Conditional Access Administrator">Conditional Access Administrator</MenuItem>
                <MenuItem value="Directory Readers">Directory Readers</MenuItem>
                <MenuItem value="Directory Writers">Directory Writers</MenuItem>
                <MenuItem value="External Identity Provider Administrator">External Identity Provider Administrator</MenuItem>
                <MenuItem value="Groups Administrator">Groups Administrator</MenuItem>
                <MenuItem value="Guest Inviter">Guest Inviter</MenuItem>
                <MenuItem value="Helpdesk Administrator">Helpdesk Administrator</MenuItem>
                <MenuItem value="Hybrid Identity Administrator">Hybrid Identity Administrator</MenuItem>
                <MenuItem value="Identity Governance Administrator">Identity Governance Administrator</MenuItem>
                <MenuItem value="License Administrator">License Administrator</MenuItem>
                <MenuItem value="Password Administrator">Password Administrator</MenuItem>
                <MenuItem value="Privileged Authentication Administrator">Privileged Authentication Administrator</MenuItem>
                
                {/* Security & Compliance */}
                <MenuItem value="Security Administrator">Security Administrator</MenuItem>
                <MenuItem value="Security Operator">Security Operator</MenuItem>
                <MenuItem value="Security Reader">Security Reader</MenuItem>
                <MenuItem value="Compliance Administrator">Compliance Administrator</MenuItem>
                <MenuItem value="Compliance Data Administrator">Compliance Data Administrator</MenuItem>
                <MenuItem value="Cloud Device Administrator">Cloud Device Administrator</MenuItem>
                <MenuItem value="Azure AD Joined Device Local Administrator">Azure AD Joined Device Local Administrator</MenuItem>
                
                {/* Exchange & Communication */}
                <MenuItem value="Exchange Administrator">Exchange Administrator</MenuItem>
                <MenuItem value="Exchange Recipient Administrator">Exchange Recipient Administrator</MenuItem>
                <MenuItem value="Teams Administrator">Teams Administrator</MenuItem>
                <MenuItem value="Teams Communications Administrator">Teams Communications Administrator</MenuItem>
                <MenuItem value="Teams Communications Support Engineer">Teams Communications Support Engineer</MenuItem>
                <MenuItem value="Teams Communications Support Specialist">Teams Communications Support Specialist</MenuItem>
                <MenuItem value="Teams Devices Administrator">Teams Devices Administrator</MenuItem>
                <MenuItem value="Skype for Business Administrator">Skype for Business Administrator</MenuItem>
                
                {/* SharePoint & Office 365 */}
                <MenuItem value="SharePoint Administrator">SharePoint Administrator</MenuItem>
                <MenuItem value="Office Apps Administrator">Office Apps Administrator</MenuItem>
                <MenuItem value="Service Support Administrator">Service Support Administrator</MenuItem>
                
                {/* Power Platform */}
                <MenuItem value="Power BI Administrator">Power BI Administrator</MenuItem>
                <MenuItem value="Power Platform Administrator">Power Platform Administrator</MenuItem>
                <MenuItem value="Dynamics 365 Administrator">Dynamics 365 Administrator</MenuItem>
                
                {/* Azure & Cloud Services */}
                <MenuItem value="Cloud Application Administrator">Cloud Application Administrator</MenuItem>
                <MenuItem value="Azure Information Protection Administrator">Azure Information Protection Administrator</MenuItem>
                <MenuItem value="Desktop Analytics Administrator">Desktop Analytics Administrator</MenuItem>
                
                {/* Intune & Device Management */}
                <MenuItem value="Intune Administrator">Intune Administrator</MenuItem>
                <MenuItem value="Device Managers">Device Managers</MenuItem>
                
                {/* Reports & Analytics */}
                <MenuItem value="Reports Reader">Reports Reader</MenuItem>
                <MenuItem value="Message Center Reader">Message Center Reader</MenuItem>
                <MenuItem value="Message Center Privacy Reader">Message Center Privacy Reader</MenuItem>
                <MenuItem value="Usage Summary Reports Reader">Usage Summary Reports Reader</MenuItem>
                
                {/* Billing & Purchasing */}
                <MenuItem value="Billing Administrator">Billing Administrator</MenuItem>
                <MenuItem value="Purchase Administrator">Purchase Administrator</MenuItem>
                
                {/* Service-Specific Roles */}
                <MenuItem value="Search Administrator">Search Administrator</MenuItem>
                <MenuItem value="Search Editor">Search Editor</MenuItem>
                <MenuItem value="Insights Administrator">Insights Administrator</MenuItem>
                <MenuItem value="Insights Business Leader">Insights Business Leader</MenuItem>
                <MenuItem value="Knowledge Administrator">Knowledge Administrator</MenuItem>
                <MenuItem value="Knowledge Manager">Knowledge Manager</MenuItem>
                <MenuItem value="Printer Administrator">Printer Administrator</MenuItem>
                <MenuItem value="Printer Technician">Printer Technician</MenuItem>
                <MenuItem value="Attack Payload Author">Attack Payload Author</MenuItem>
                <MenuItem value="Attack Simulation Administrator">Attack Simulation Administrator</MenuItem>
                
                {/* Directory Synchronization */}
                <MenuItem value="Directory Synchronization Accounts">Directory Synchronization Accounts</MenuItem>
                <MenuItem value="Hybrid Identity Administrator">Hybrid Identity Administrator</MenuItem>
                
                {/* Limited Admin Roles */}
                <MenuItem value="Domain Name Administrator">Domain Name Administrator</MenuItem>
                <MenuItem value="Partner Tier1 Support">Partner Tier1 Support</MenuItem>
                <MenuItem value="Partner Tier2 Support">Partner Tier2 Support</MenuItem>
                
                {/* Custom & External */}
                <MenuItem value="External Identity Provider Administrator">External Identity Provider Administrator</MenuItem>
                <MenuItem value="B2C IEF Keyset Administrator">B2C IEF Keyset Administrator</MenuItem>
                <MenuItem value="B2C IEF Policy Administrator">B2C IEF Policy Administrator</MenuItem>
              </Select>
            </FormControl>
            <Alert severity="info">
              <Typography variant="body2">
                The new administrator will receive an email invitation and must accept it to activate their account.
                Global Administrator role grants full access to all features.
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAdminDialog(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleAddAdmin}
            disabled={!newAdmin.displayName || !newAdmin.userPrincipalName || newAdmin.roles.length === 0}
            startIcon={<Add />}
          >
            Add Administrator
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Notification */}
      <Snackbar
        open={showSaveSuccess}
        autoHideDuration={3000}
        onClose={() => setShowSaveSuccess(false)}
        message="Settings saved successfully"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default SettingsManagement;