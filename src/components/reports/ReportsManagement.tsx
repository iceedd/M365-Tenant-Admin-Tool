import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  IconButton,
  Tooltip,
  Menu,
  MenuList,
  MenuItem as MenuItemComponent
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  TrendingDown,
  People,
  Group,
  Assignment,
  Security,
  DateRange,
  GetApp,
  Refresh,
  MoreVert,
  PieChart,
  BarChart,
  ShowChart,
  Timeline,
  Analytics,
  InsertChart,
  Download,
  Print,
  Share,
  FilterList,
  Today,
  CalendarMonth,
  Schedule,
  PersonAdd,
  GroupAdd,
  LicenseIcon,
  Error,
  Warning,
  CheckCircle,
  Info
} from '@mui/icons-material';

// Report data interfaces
interface UsageMetric {
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  period: string;
}

interface LicenseReport {
  licenseName: string;
  total: number;
  assigned: number;
  available: number;
  utilization: number;
  cost: number;
  trend: number;
}

interface UserActivityReport {
  department: string;
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  newUsers: number;
  activityScore: number;
}

interface GroupMembershipReport {
  groupName: string;
  groupType: string;
  memberCount: number;
  ownerCount: number;
  lastModified: string;
  growthRate: number;
}

interface SecurityReport {
  metric: string;
  value: number;
  status: 'good' | 'warning' | 'critical';
  description: string;
  lastUpdated: string;
}

// Mock data for reports
const usageMetrics: UsageMetric[] = [
  { label: 'Total Users', value: 1247, change: 8.2, trend: 'up', period: 'vs last month' },
  { label: 'Active Users (30d)', value: 1156, change: -2.1, trend: 'down', period: 'vs last month' },
  { label: 'Licensed Users', value: 1089, change: 12.5, trend: 'up', period: 'vs last month' },
  { label: 'Groups Created', value: 47, change: 15.3, trend: 'up', period: 'vs last month' },
  { label: 'License Utilization', value: 87.2, change: 4.1, trend: 'up', period: 'percentage' },
  { label: 'Security Incidents', value: 3, change: -25.0, trend: 'down', period: 'vs last month' }
];

const licenseReports: LicenseReport[] = [
  { licenseName: 'Microsoft 365 E5', total: 200, assigned: 165, available: 35, utilization: 82.5, cost: 38.0, trend: 5.2 },
  { licenseName: 'Microsoft 365 E3', total: 500, assigned: 445, available: 55, utilization: 89.0, cost: 22.0, trend: 8.1 },
  { licenseName: 'Microsoft 365 Business Premium', total: 150, assigned: 127, available: 23, utilization: 84.7, cost: 15.0, trend: -2.3 },
  { licenseName: 'Office 365 E3', total: 300, assigned: 267, available: 33, utilization: 89.0, cost: 20.0, trend: 3.8 },
  { licenseName: 'Power BI Pro', total: 100, assigned: 78, available: 22, utilization: 78.0, cost: 10.0, trend: 12.7 }
];

const userActivityReports: UserActivityReport[] = [
  { department: 'IT', totalUsers: 45, activeUsers: 43, inactiveUsers: 2, newUsers: 3, activityScore: 95.6 },
  { department: 'Sales', totalUsers: 178, activeUsers: 165, inactiveUsers: 13, newUsers: 8, activityScore: 92.7 },
  { department: 'Marketing', totalUsers: 67, activeUsers: 61, inactiveUsers: 6, newUsers: 4, activityScore: 91.0 },
  { department: 'HR', totalUsers: 23, activeUsers: 22, inactiveUsers: 1, newUsers: 1, activityScore: 95.7 },
  { department: 'Finance', totalUsers: 34, activeUsers: 31, inactiveUsers: 3, newUsers: 2, activityScore: 91.2 },
  { department: 'Operations', totalUsers: 89, activeUsers: 82, inactiveUsers: 7, newUsers: 5, activityScore: 92.1 }
];

const groupMembershipReports: GroupMembershipReport[] = [
  { groupName: 'All Employees', groupType: 'Distribution', memberCount: 1247, ownerCount: 3, lastModified: '2025-08-15', growthRate: 2.1 },
  { groupName: 'IT Department', groupType: 'Security', memberCount: 45, ownerCount: 2, lastModified: '2025-08-16', growthRate: 6.7 },
  { groupName: 'Sales Team', groupType: 'Microsoft365', memberCount: 178, ownerCount: 5, lastModified: '2025-08-14', growthRate: 4.5 },
  { groupName: 'Project Alpha', groupType: 'Microsoft365', memberCount: 12, ownerCount: 2, lastModified: '2025-08-17', growthRate: 20.0 },
  { groupName: 'Managers', groupType: 'Security', memberCount: 67, ownerCount: 1, lastModified: '2025-08-10', growthRate: 1.5 }
];

const securityReports: SecurityReport[] = [
  { metric: 'Multi-Factor Authentication Coverage', value: 94.2, status: 'good', description: '94.2% of users have MFA enabled', lastUpdated: '2025-08-17' },
  { metric: 'Guest User Access Reviews', value: 78.0, status: 'warning', description: '22% of guest users need access review', lastUpdated: '2025-08-15' },
  { metric: 'Privileged Role Assignments', value: 12, status: 'good', description: '12 users with privileged roles', lastUpdated: '2025-08-16' },
  { metric: 'Conditional Access Policies', value: 8, status: 'good', description: '8 active conditional access policies', lastUpdated: '2025-08-14' },
  { metric: 'Risky Sign-ins (7 days)', value: 3, status: 'critical', description: '3 risky sign-in attempts detected', lastUpdated: '2025-08-17' }
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

const ReportsManagement: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [dateRange, setDateRange] = useState('30days');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log(`Reports refreshed successfully for ${dateRange}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDateRangeChange = (newRange: string) => {
    setDateRange(newRange);
    console.log(`Time range changed to: ${newRange}`);
    
    // In a real implementation, this would trigger API calls to fetch data for the selected period
    // For demo purposes, we'll simulate different data based on the range
    
    // This would typically call something like:
    // fetchUsageMetrics(newRange);
    // fetchLicenseReports(newRange);
    // fetchUserActivityReports(newRange);
    // etc.
    
    // Show visual feedback that data is changing
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      console.log(`Data updated for ${newRange} period`);
    }, 800);
  };

  const handleExport = (format: string) => {
    const timeRangeLabel = dateRange.replace('days', 'd').replace('1year', '1y');
    const filename = `M365_Reports_${timeRangeLabel}_${new Date().toISOString().split('T')[0]}`;
    
    console.log(`Exporting reports in ${format} format`);
    console.log(`Filename: ${filename}.${format.toLowerCase()}`);
    console.log(`Data range: ${dateRange}`);
    console.log(`Current tab: ${currentTab === 0 ? 'License Analytics' : 
                                currentTab === 1 ? 'User Activity' : 
                                currentTab === 2 ? 'Group Insights' : 'Security Reports'}`);
    
    // In a real implementation, this would generate and download the actual file
    // with the filtered data based on the current dateRange and currentTab
    
    setAnchorEl(null);
  };

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === 'up' || change > 0) return <TrendingUp color="success" />;
    if (trend === 'down' || change < 0) return <TrendingDown color="error" />;
    return <ShowChart color="info" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle color="success" />;
      case 'warning': return <Warning color="warning" />;
      case 'critical': return <Error color="error" />;
      default: return <Info color="info" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'success';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      default: return 'info';
    }
  };

  const MetricCard = ({ metric }: { metric: UsageMetric }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            {metric.label}
          </Typography>
          {getTrendIcon(metric.trend, metric.change)}
        </Box>
        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
          {metric.label.includes('Utilization') ? `${metric.value}%` : metric.value.toLocaleString()}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography 
            variant="body2" 
            color={metric.change > 0 ? 'success.main' : metric.change < 0 ? 'error.main' : 'text.secondary'}
            sx={{ fontWeight: 500 }}
          >
            {metric.change > 0 ? '+' : ''}{metric.change}%
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {metric.period}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Reports & Analytics
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={dateRange}
              label="Time Range"
              onChange={(e) => handleDateRangeChange(e.target.value)}
            >
              <MenuItem value="7days">Last 7 days</MenuItem>
              <MenuItem value="30days">Last 30 days</MenuItem>
              <MenuItem value="90days">Last 90 days</MenuItem>
              <MenuItem value="1year">Last year</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<GetApp />}
            onClick={(e) => setAnchorEl(e.currentTarget)}
          >
            Export
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

      {/* Key Metrics Overview */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Key Metrics Overview
        </Typography>
        <Chip 
          label={`Data for: ${
            dateRange === '7days' ? 'Last 7 days' :
            dateRange === '30days' ? 'Last 30 days' :
            dateRange === '90days' ? 'Last 90 days' : 'Last year'
          }`}
          color="primary"
          variant="outlined"
          size="small"
        />
      </Box>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {usageMetrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
            <MetricCard metric={metric} />
          </Grid>
        ))}
      </Grid>

      {/* Reports Tabs */}
      <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)} sx={{ mb: 2 }}>
        <Tab label="License Analytics" icon={<Assignment />} />
        <Tab label="User Activity" icon={<People />} />
        <Tab label="Group Insights" icon={<Group />} />
        <Tab label="Security Reports" icon={<Security />} />
      </Tabs>

      <TabPanel value={currentTab} index={0}>
        {/* License Analytics */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
              <Assignment sx={{ mr: 1 }} />
              License Utilization & Cost Analysis
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>License Type</TableCell>
                    <TableCell align="center">Total</TableCell>
                    <TableCell align="center">Assigned</TableCell>
                    <TableCell align="center">Available</TableCell>
                    <TableCell align="center">Utilization</TableCell>
                    <TableCell align="center">Monthly Cost</TableCell>
                    <TableCell align="center">Trend</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {licenseReports.map((license, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {license.licenseName}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">{license.total}</TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" color="primary.main" fontWeight="medium">
                          {license.assigned}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography 
                          variant="body2" 
                          color={license.available < 20 ? 'error.main' : 'success.main'}
                          fontWeight="medium"
                        >
                          {license.available}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={license.utilization}
                            sx={{ 
                              width: 60, 
                              height: 8, 
                              borderRadius: 4,
                              backgroundColor: 'grey.200',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 4,
                                backgroundColor: license.utilization > 90 ? 'error.main' : 
                                               license.utilization > 75 ? 'warning.main' : 'success.main'
                              }
                            }}
                          />
                          <Typography variant="body2" fontWeight="medium">
                            {license.utilization.toFixed(1)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          ${(license.assigned * license.cost).toFixed(0)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          (${license.cost}/user)
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                          {getTrendIcon('', license.trend)}
                          <Typography 
                            variant="body2" 
                            color={license.trend > 0 ? 'success.main' : license.trend < 0 ? 'error.main' : 'text.secondary'}
                          >
                            {license.trend > 0 ? '+' : ''}{license.trend.toFixed(1)}%
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        {/* User Activity */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
              <People sx={{ mr: 1 }} />
              User Activity by Department
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Department</TableCell>
                    <TableCell align="center">Total Users</TableCell>
                    <TableCell align="center">Active Users</TableCell>
                    <TableCell align="center">Inactive Users</TableCell>
                    <TableCell align="center">New Users</TableCell>
                    <TableCell align="center">Activity Score</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {userActivityReports.map((dept, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {dept.department}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">{dept.totalUsers}</TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" color="success.main" fontWeight="medium">
                          {dept.activeUsers}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography 
                          variant="body2" 
                          color={dept.inactiveUsers > 5 ? 'warning.main' : 'text.secondary'}
                        >
                          {dept.inactiveUsers}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`+${dept.newUsers}`}
                          size="small"
                          color="info"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={dept.activityScore}
                            sx={{ 
                              width: 60, 
                              height: 8, 
                              borderRadius: 4,
                              backgroundColor: 'grey.200',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 4,
                                backgroundColor: dept.activityScore > 95 ? 'success.main' : 
                                               dept.activityScore > 90 ? 'info.main' : 'warning.main'
                              }
                            }}
                          />
                          <Typography variant="body2" fontWeight="medium">
                            {dept.activityScore.toFixed(1)}%
                          </Typography>
                        </Box>
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
        {/* Group Insights */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
              <Group sx={{ mr: 1 }} />
              Group Membership Analytics
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Group Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="center">Members</TableCell>
                    <TableCell align="center">Owners</TableCell>
                    <TableCell align="center">Last Modified</TableCell>
                    <TableCell align="center">Growth Rate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {groupMembershipReports.map((group, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {group.groupName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={group.groupType}
                          size="small"
                          color={
                            group.groupType === 'Security' ? 'error' :
                            group.groupType === 'Microsoft365' ? 'primary' : 'secondary'
                          }
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight="medium">
                          {group.memberCount.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">{group.ownerCount}</TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {new Date(group.lastModified).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                          {getTrendIcon('', group.growthRate)}
                          <Typography 
                            variant="body2" 
                            color={group.growthRate > 0 ? 'success.main' : group.growthRate < 0 ? 'error.main' : 'text.secondary'}
                          >
                            {group.growthRate > 0 ? '+' : ''}{group.growthRate.toFixed(1)}%
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={currentTab} index={3}>
        {/* Security Reports */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
              <Security sx={{ mr: 1 }} />
              Security & Compliance Overview
            </Typography>
            <List>
              {securityReports.map((report, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemIcon>
                      {getStatusIcon(report.status)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body1" fontWeight="medium">
                            {report.metric}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="h6" fontWeight="bold">
                              {typeof report.value === 'number' && report.value < 100 ? 
                                `${report.value}%` : report.value}
                            </Typography>
                            <Chip
                              label={report.status.toUpperCase()}
                              size="small"
                              color={getStatusColor(report.status) as any}
                            />
                          </Box>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="body2" color="text.secondary">
                            {report.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Last updated: {new Date(report.lastUpdated).toLocaleDateString()}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < securityReports.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Export Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuList>
          <MenuItemComponent onClick={() => handleExport('PDF')}>
            <ListItemIcon><Print /></ListItemIcon>
            Export as PDF
          </MenuItemComponent>
          <MenuItemComponent onClick={() => handleExport('Excel')}>
            <ListItemIcon><GetApp /></ListItemIcon>
            Export as Excel
          </MenuItemComponent>
          <MenuItemComponent onClick={() => handleExport('CSV')}>
            <ListItemIcon><Download /></ListItemIcon>
            Export as CSV
          </MenuItemComponent>
        </MenuList>
      </Menu>
    </Box>
  );
};

export default ReportsManagement;