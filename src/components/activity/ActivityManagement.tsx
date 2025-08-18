import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  Badge,
  Avatar,
  Tooltip,
  Menu,
  MenuList,
  MenuItem as MenuItemComponent,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  History,
  PersonAdd,
  PersonRemove,
  GroupAdd,
  GroupRemove,
  Assignment,
  Security,
  Email,
  Refresh,
  FilterList,
  Search,
  GetApp,
  ExpandMore,
  AccessTime,
  Error,
  Warning,
  CheckCircle,
  Info,
  Admin,
  Person,
  Group,
  Business,
  VpnKey,
  Shield,
  Visibility,
  VisibilityOff,
  CloudSync,
  Edit,
  Delete,
  Settings,
  TrendingUp,
  TrendingDown,
  Today,
  DateRange,
  Schedule
} from '@mui/icons-material';

// Types for Activity Logging based on M365 audit patterns
interface ActivityLog {
  id: string;
  timestamp: string;
  actor: {
    id: string;
    displayName: string;
    userPrincipalName: string;
    userType: 'Member' | 'Guest' | 'ServicePrincipal';
  };
  action: string;
  actionType: 'Create' | 'Update' | 'Delete' | 'Assign' | 'Remove' | 'Enable' | 'Disable' | 'Reset' | 'Export' | 'Import';
  resource: {
    type: 'User' | 'Group' | 'License' | 'Role' | 'Application' | 'Policy' | 'Tenant';
    id: string;
    displayName: string;
  };
  details: {
    changes?: Array<{
      property: string;
      oldValue?: string;
      newValue?: string;
    }>;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    location?: string;
  };
  result: 'Success' | 'Failure' | 'Warning';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  category: 'UserManagement' | 'GroupManagement' | 'LicenseManagement' | 'SecurityManagement' | 'TenantManagement' | 'Authentication' | 'DataExport';
}

// Mock activity data based on M365 audit log patterns
const mockActivityLogs: ActivityLog[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
    actor: {
      id: 'admin1',
      displayName: 'Sarah Wilson',
      userPrincipalName: 'sarah.wilson@contoso.com',
      userType: 'Member'
    },
    action: 'Created new user account',
    actionType: 'Create',
    resource: {
      type: 'User',
      id: 'user123',
      displayName: 'John Smith'
    },
    details: {
      changes: [
        { property: 'userPrincipalName', newValue: 'john.smith@contoso.com' },
        { property: 'displayName', newValue: 'John Smith' },
        { property: 'department', newValue: 'IT' },
        { property: 'jobTitle', newValue: 'Developer' }
      ],
      metadata: { licenseAssigned: 'Microsoft 365 E5', passwordGenerated: true },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      location: 'London, UK'
    },
    result: 'Success',
    severity: 'Medium',
    category: 'UserManagement'
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    actor: {
      id: 'admin2',
      displayName: 'Mike Johnson',
      userPrincipalName: 'mike.johnson@contoso.com',
      userType: 'Member'
    },
    action: 'Added members to security group',
    actionType: 'Assign',
    resource: {
      type: 'Group',
      id: 'group456',
      displayName: 'IT Department'
    },
    details: {
      changes: [
        { property: 'members', newValue: '3 users added' }
      ],
      metadata: { 
        membersAdded: ['jane.doe@contoso.com', 'bob.smith@contoso.com', 'alice.brown@contoso.com'],
        groupType: 'Security'
      },
      ipAddress: '192.168.1.105',
      location: 'Manchester, UK'
    },
    result: 'Success',
    severity: 'Low',
    category: 'GroupManagement'
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 minutes ago
    actor: {
      id: 'admin1',
      displayName: 'Sarah Wilson',
      userPrincipalName: 'sarah.wilson@contoso.com',
      userType: 'Member'
    },
    action: 'Assigned Microsoft 365 E3 license',
    actionType: 'Assign',
    resource: {
      type: 'License',
      id: 'license789',
      displayName: 'Microsoft 365 E3'
    },
    details: {
      changes: [
        { property: 'assignedTo', newValue: 'emma.watson@contoso.com' },
        { property: 'servicePlans', newValue: 'Exchange Online, SharePoint Online, Teams' }
      ],
      metadata: { 
        licenseCost: '$20/month',
        availableLicenses: 47,
        assignmentMethod: 'Manual'
      },
      ipAddress: '192.168.1.100'
    },
    result: 'Success',
    severity: 'Low',
    category: 'LicenseManagement'
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
    actor: {
      id: 'admin3',
      displayName: 'David Brown',
      userPrincipalName: 'david.brown@contoso.com',
      userType: 'Member'
    },
    action: 'Failed to reset user password',
    actionType: 'Reset',
    resource: {
      type: 'User',
      id: 'user567',
      displayName: 'External Consultant'
    },
    details: {
      metadata: { 
        errorCode: 'Forbidden',
        errorMessage: 'Insufficient privileges to reset guest user password',
        userType: 'Guest'
      },
      ipAddress: '192.168.1.110'
    },
    result: 'Failure',
    severity: 'High',
    category: 'SecurityManagement'
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 1000 * 60 * 75).toISOString(), // 1.25 hours ago
    actor: {
      id: 'system',
      displayName: 'System',
      userPrincipalName: 'system@contoso.com',
      userType: 'ServicePrincipal'
    },
    action: 'Bulk import completed',
    actionType: 'Import',
    resource: {
      type: 'User',
      id: 'bulk-import-001',
      displayName: 'Bulk User Import'
    },
    details: {
      metadata: { 
        totalUsers: 25,
        successfulCreations: 23,
        failures: 2,
        csvFileName: 'new_employees_Q3_2025.csv'
      }
    },
    result: 'Warning',
    severity: 'Medium',
    category: 'UserManagement'
  },
  {
    id: '6',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 1.5 hours ago
    actor: {
      id: 'admin2',
      displayName: 'Mike Johnson',
      userPrincipalName: 'mike.johnson@contoso.com',
      userType: 'Member'
    },
    action: 'Exported group membership data',
    actionType: 'Export',
    resource: {
      type: 'Group',
      id: 'export-001',
      displayName: 'All Security Groups'
    },
    details: {
      metadata: { 
        exportFormat: 'CSV',
        recordCount: 45,
        fileName: 'security_groups_export_20250817.csv'
      },
      ipAddress: '192.168.1.105'
    },
    result: 'Success',
    severity: 'Low',
    category: 'DataExport'
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

const ActivityManagement: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterResult, setFilterResult] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('today');
  const [selectedActivity, setSelectedActivity] = useState<ActivityLog | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);

  // Real-time activity simulation
  useEffect(() => {
    if (!realTimeEnabled) return;

    const interval = setInterval(() => {
      // Simulate new activity every 30 seconds
      console.log('New activity detected (simulated)');
    }, 30000);

    return () => clearInterval(interval);
  }, [realTimeEnabled]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Simulate API call to refresh activity logs
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Activity logs refreshed');
    } finally {
      setIsRefreshing(false);
    }
  };

  const getActivityIcon = (actionType: string, result: string) => {
    const iconColor = result === 'Success' ? 'success' : result === 'Failure' ? 'error' : 'warning';
    
    switch (actionType) {
      case 'Create':
        return <PersonAdd color={iconColor} />;
      case 'Update':
        return <Edit color={iconColor} />;
      case 'Delete':
        return <Delete color={iconColor} />;
      case 'Assign':
        return <Assignment color={iconColor} />;
      case 'Remove':
        return <PersonRemove color={iconColor} />;
      case 'Reset':
        return <VpnKey color={iconColor} />;
      case 'Export':
        return <GetApp color={iconColor} />;
      case 'Import':
        return <CloudSync color={iconColor} />;
      default:
        return <History color={iconColor} />;
    }
  };

  const getResourceIcon = (resourceType: string) => {
    switch (resourceType) {
      case 'User':
        return <Person />;
      case 'Group':
        return <Group />;
      case 'License':
        return <Assignment />;
      case 'Role':
        return <Admin />;
      default:
        return <Business />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return 'error';
      case 'High':
        return 'warning';
      case 'Medium':
        return 'info';
      case 'Low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'UserManagement':
        return 'primary';
      case 'GroupManagement':
        return 'secondary';
      case 'LicenseManagement':
        return 'success';
      case 'SecurityManagement':
        return 'error';
      case 'DataExport':
        return 'info';
      default:
        return 'default';
    }
  };

  const filteredActivities = mockActivityLogs.filter(activity => {
    const matchesSearch = 
      activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.actor.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.resource.displayName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || activity.category === filterCategory;
    const matchesSeverity = filterSeverity === 'all' || activity.severity === filterSeverity;
    const matchesResult = filterResult === 'all' || activity.result === filterResult;
    
    // Date filtering (simplified)
    const activityDate = new Date(activity.timestamp);
    const now = new Date();
    const matchesDate = (() => {
      switch (dateRange) {
        case 'today':
          return activityDate.toDateString() === now.toDateString();
        case 'week':
          return (now.getTime() - activityDate.getTime()) <= (7 * 24 * 60 * 60 * 1000);
        case 'month':
          return (now.getTime() - activityDate.getTime()) <= (30 * 24 * 60 * 60 * 1000);
        default:
          return true;
      }
    })();

    return matchesSearch && matchesCategory && matchesSeverity && matchesResult && matchesDate;
  });

  const activityStats = {
    total: mockActivityLogs.length,
    success: mockActivityLogs.filter(a => a.result === 'Success').length,
    warnings: mockActivityLogs.filter(a => a.result === 'Warning').length,
    failures: mockActivityLogs.filter(a => a.result === 'Failure').length,
    critical: mockActivityLogs.filter(a => a.severity === 'Critical').length
  };

  const StatCard = ({ icon, title, value, subtitle, color = 'primary' }: any) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box sx={{ color: `${color}.main`, mr: 1 }}>{icon}</Box>
          <Typography variant="subtitle2" color="text.secondary">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 0.5 }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Activity Logs
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Chip
            label={realTimeEnabled ? 'Real-time ON' : 'Real-time OFF'}
            color={realTimeEnabled ? 'success' : 'default'}
            onClick={() => setRealTimeEnabled(!realTimeEnabled)}
            icon={realTimeEnabled ? <Visibility /> : <VisibilityOff />}
          />
          <Button
            variant="outlined"
            startIcon={<GetApp />}
          >
            Export Logs
          </Button>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Box>
      </Box>

      {/* Activity Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            icon={<History />}
            title="Total Activities"
            value={activityStats.total}
            subtitle="Last 24 hours"
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            icon={<CheckCircle />}
            title="Successful"
            value={activityStats.success}
            subtitle={`${Math.round((activityStats.success / activityStats.total) * 100)}% success rate`}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            icon={<Warning />}
            title="Warnings"
            value={activityStats.warnings}
            subtitle="Require attention"
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            icon={<Error />}
            title="Failures"
            value={activityStats.failures}
            subtitle="Failed operations"
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            icon={<Shield />}
            title="Critical Events"
            value={activityStats.critical}
            subtitle="High priority"
            color="error"
          />
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={filterCategory}
                  label="Category"
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  <MenuItem value="UserManagement">User Management</MenuItem>
                  <MenuItem value="GroupManagement">Group Management</MenuItem>
                  <MenuItem value="LicenseManagement">License Management</MenuItem>
                  <MenuItem value="SecurityManagement">Security Management</MenuItem>
                  <MenuItem value="DataExport">Data Export</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Severity</InputLabel>
                <Select
                  value={filterSeverity}
                  label="Severity"
                  onChange={(e) => setFilterSeverity(e.target.value)}
                >
                  <MenuItem value="all">All Severities</MenuItem>
                  <MenuItem value="Critical">Critical</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="Low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Result</InputLabel>
                <Select
                  value={filterResult}
                  label="Result"
                  onChange={(e) => setFilterResult(e.target.value)}
                >
                  <MenuItem value="all">All Results</MenuItem>
                  <MenuItem value="Success">Success</MenuItem>
                  <MenuItem value="Warning">Warning</MenuItem>
                  <MenuItem value="Failure">Failure</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={dateRange}
                  label="Time Range"
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="week">Last 7 days</MenuItem>
                  <MenuItem value="month">Last 30 days</MenuItem>
                  <MenuItem value="all">All time</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={1}>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                {filteredActivities.length} results
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Views */}
      <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)} sx={{ mb: 2 }}>
        <Tab label="Timeline View" icon={<Timeline />} />
        <Tab label="Table View" icon={<History />} />
        <Tab label="Live Feed" icon={<TrendingUp />} />
      </Tabs>

      <TabPanel value={currentTab} index={0}>
        {/* Timeline View */}
        <Timeline>
          {filteredActivities.map((activity, index) => (
            <TimelineItem key={activity.id}>
              <TimelineOppositeContent color="text.secondary" sx={{ flex: 0.3 }}>
                <Typography variant="body2">
                  {new Date(activity.timestamp).toLocaleTimeString()}
                </Typography>
                <Typography variant="caption">
                  {new Date(activity.timestamp).toLocaleDateString()}
                </Typography>
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineDot color={activity.result === 'Success' ? 'success' : activity.result === 'Failure' ? 'error' : 'warning'}>
                  {getActivityIcon(activity.actionType, activity.result)}
                </TimelineDot>
                {index < filteredActivities.length - 1 && <TimelineConnector />}
              </TimelineSeparator>
              <TimelineContent>
                <Card sx={{ mb: 2, cursor: 'pointer' }} onClick={() => setSelectedActivity(activity)}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" component="div">
                        {activity.action}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip
                          label={activity.category.replace(/([A-Z])/g, ' $1').trim()}
                          size="small"
                          color={getCategoryColor(activity.category) as any}
                        />
                        <Chip
                          label={activity.severity}
                          size="small"
                          color={getSeverityColor(activity.severity) as any}
                        />
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>{activity.actor.displayName}</strong> performed action on{' '}
                      <strong>{activity.resource.displayName}</strong>
                    </Typography>
                    {activity.details.changes && activity.details.changes.length > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        Modified: {activity.details.changes.map(c => c.property).join(', ')}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        {/* Table View */}
        <Card>
          <CardContent>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Time</TableCell>
                    <TableCell>Actor</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Resource</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="center">Result</TableCell>
                    <TableCell align="center">Severity</TableCell>
                    <TableCell align="center">Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredActivities.map((activity) => (
                    <TableRow key={activity.id} hover>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(activity.timestamp).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                            {activity.actor.displayName.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {activity.actor.displayName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {activity.actor.userPrincipalName}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getActivityIcon(activity.actionType, activity.result)}
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            {activity.action}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getResourceIcon(activity.resource.type)}
                          <Box sx={{ ml: 1 }}>
                            <Typography variant="body2" fontWeight="medium">
                              {activity.resource.displayName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {activity.resource.type}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={activity.category.replace(/([A-Z])/g, ' $1').trim()}
                          size="small"
                          color={getCategoryColor(activity.category) as any}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={activity.result}
                          size="small"
                          color={
                            activity.result === 'Success' ? 'success' :
                            activity.result === 'Failure' ? 'error' : 'warning'
                          }
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={activity.severity}
                          size="small"
                          color={getSeverityColor(activity.severity) as any}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => setSelectedActivity(activity)}>
                          <Visibility />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        {/* Live Feed */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Live Activity Feed</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Badge color="success" variant="dot" invisible={!realTimeEnabled}>
                  <Typography variant="body2">
                    {realTimeEnabled ? 'Real-time monitoring active' : 'Real-time monitoring paused'}
                  </Typography>
                </Badge>
              </Box>
            </Box>
            <List>
              {filteredActivities.slice(0, 10).map((activity, index) => (
                <React.Fragment key={activity.id}>
                  <ListItem>
                    <ListItemIcon>
                      {getActivityIcon(activity.actionType, activity.result)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body1">
                            <strong>{activity.actor.displayName}</strong> {activity.action.toLowerCase()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(activity.timestamp).toLocaleTimeString()}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Chip label={activity.resource.type} size="small" variant="outlined" />
                          <Typography variant="caption" color="text.secondary">
                            {activity.resource.displayName}
                          </Typography>
                          <Chip
                            label={activity.result}
                            size="small"
                            color={
                              activity.result === 'Success' ? 'success' :
                              activity.result === 'Failure' ? 'error' : 'warning'
                            }
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < Math.min(filteredActivities.length, 10) - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Activity Details Dialog */}
      <Dialog open={!!selectedActivity} onClose={() => setSelectedActivity(null)} maxWidth="md" fullWidth>
        {selectedActivity && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Activity Details
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label={selectedActivity.result}
                    color={
                      selectedActivity.result === 'Success' ? 'success' :
                      selectedActivity.result === 'Failure' ? 'error' : 'warning'
                    }
                  />
                  <Chip
                    label={selectedActivity.severity}
                    color={getSeverityColor(selectedActivity.severity) as any}
                  />
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    {selectedActivity.action}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {new Date(selectedActivity.timestamp).toLocaleString()}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Actor Information</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ mr: 2 }}>{selectedActivity.actor.displayName.charAt(0)}</Avatar>
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedActivity.actor.displayName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedActivity.actor.userPrincipalName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {selectedActivity.actor.userType}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Resource Information</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {getResourceIcon(selectedActivity.resource.type)}
                    <Box sx={{ ml: 2 }}>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedActivity.resource.displayName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedActivity.resource.type}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {selectedActivity.resource.id}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                {selectedActivity.details.changes && selectedActivity.details.changes.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>Changes Made</Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Property</TableCell>
                            <TableCell>Old Value</TableCell>
                            <TableCell>New Value</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedActivity.details.changes.map((change, index) => (
                            <TableRow key={index}>
                              <TableCell fontWeight="medium">{change.property}</TableCell>
                              <TableCell>{change.oldValue || '-'}</TableCell>
                              <TableCell>{change.newValue || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                )}

                {selectedActivity.details.metadata && (
                  <Grid item xs={12}>
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="subtitle2">Additional Details</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <pre style={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>
                          {JSON.stringify(selectedActivity.details.metadata, null, 2)}
                        </pre>
                      </AccordionDetails>
                    </Accordion>
                  </Grid>
                )}

                {selectedActivity.details.ipAddress && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>Technical Details</Typography>
                    <Typography variant="body2">
                      <strong>IP Address:</strong> {selectedActivity.details.ipAddress}
                    </Typography>
                    {selectedActivity.details.location && (
                      <Typography variant="body2">
                        <strong>Location:</strong> {selectedActivity.details.location}
                      </Typography>
                    )}
                    {selectedActivity.details.userAgent && (
                      <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                        <strong>User Agent:</strong> {selectedActivity.details.userAgent}
                      </Typography>
                    )}
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedActivity(null)}>Close</Button>
              <Button variant="contained" startIcon={<GetApp />}>
                Export Details
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default ActivityManagement;