import React, { useState, useEffect } from 'react';
import { 
  useGetUsageMetricsQuery,
  useGetLicenseReportsQuery, 
  useGetUserActivityReportsQuery, 
  useGetGroupMembershipReportsQuery,
  useGetSecurityReportsQuery 
} from '../../store/api/reportsApi';
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

// Initialize with empty data - will be populated from the API
const initialReportData = {
  usageMetrics: [] as UsageMetric[],
  licenseReports: [] as LicenseReport[],
  userActivityReports: [] as UserActivityReport[],
  groupMembershipReports: [] as GroupMembershipReport[],
  securityReports: [] as SecurityReport[]
};

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
  
  // Report data state
  const [reportData, setReportData] = useState(initialReportData);
  
  // Fetch report data on component mount and when date range changes
  // Use RTK Query hooks to fetch data
  const {
    data: usageMetricsData = [],
    isLoading: isLoadingUsage,
    refetch: refetchUsage
  } = useGetUsageMetricsQuery(dateRange, { refetchOnMountOrArgChange: true });
  
  const {
    data: licenseReportsData = [],
    isLoading: isLoadingLicense,
    refetch: refetchLicense
  } = useGetLicenseReportsQuery(dateRange, { refetchOnMountOrArgChange: true });
  
  const {
    data: userActivityReportsData = [],
    isLoading: isLoadingActivity,
    refetch: refetchActivity
  } = useGetUserActivityReportsQuery(dateRange, { refetchOnMountOrArgChange: true });
  
  const {
    data: groupMembershipReportsData = [],
    isLoading: isLoadingGroups,
    refetch: refetchGroups
  } = useGetGroupMembershipReportsQuery(dateRange, { refetchOnMountOrArgChange: true });
  
  const {
    data: securityReportsData = [],
    isLoading: isLoadingSecurity,
    refetch: refetchSecurity
  } = useGetSecurityReportsQuery(dateRange, { refetchOnMountOrArgChange: true });

  // Update the reportData state when the API data changes
  useEffect(() => {
    setReportData({
      usageMetrics: usageMetricsData || [],
      licenseReports: licenseReportsData || [],
      userActivityReports: userActivityReportsData || [],
      groupMembershipReports: groupMembershipReportsData || [],
      securityReports: securityReportsData || []
    });
    
    // Set the refreshing state based on loading states
    setIsRefreshing(
      isLoadingUsage || 
      isLoadingLicense || 
      isLoadingActivity || 
      isLoadingGroups || 
      isLoadingSecurity
    );
  }, [
    usageMetricsData, 
    licenseReportsData, 
    userActivityReportsData, 
    groupMembershipReportsData, 
    securityReportsData,
    isLoadingUsage,
    isLoadingLicense,
    isLoadingActivity,
    isLoadingGroups,
    isLoadingSecurity
  ]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Trigger all refetch functions
      await Promise.all([
        refetchUsage(),
        refetchLicense(),
        refetchActivity(),
        refetchGroups(),
        refetchSecurity()
      ]);
      console.log(`Reports refreshed successfully for ${dateRange}`);
    } catch (error) {
      console.error('Error refreshing reports:', error);
    }
  };

  const handleDateRangeChange = (newRange: string) => {
    // Simply update the date range state
    // The useEffect will trigger the data refresh
    setDateRange(newRange);
    console.log(`Time range changed to: ${newRange}`);
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
        {reportData.usageMetrics.length > 0 ? (
          reportData.usageMetrics.map((metric, index) => (
            <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
              <MetricCard metric={metric} />
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Alert severity="info">
              No usage metrics available. Connect to a tenant to view metrics.
            </Alert>
          </Grid>
        )}
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
                  {reportData.licenseReports.length > 0 ? (
                    reportData.licenseReports.map((license, index) => (
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
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Alert severity="info" sx={{ my: 2 }}>
                          No license data available. Connect to a tenant to view license information.
                        </Alert>
                      </TableCell>
                    </TableRow>
                  )}
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
                  {reportData.userActivityReports.length > 0 ? (
                    reportData.userActivityReports.map((dept, index) => (
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
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Alert severity="info" sx={{ my: 2 }}>
                          No user activity data available. Connect to a tenant to view user activity information.
                        </Alert>
                      </TableCell>
                    </TableRow>
                  )}
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
                  {reportData.groupMembershipReports.length > 0 ? (
                    reportData.groupMembershipReports.map((group, index) => (
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
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Alert severity="info" sx={{ my: 2 }}>
                          No group membership data available. Connect to a tenant to view group information.
                        </Alert>
                      </TableCell>
                    </TableRow>
                  )}
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
              {reportData.securityReports.length > 0 ? (
                reportData.securityReports.map((report, index) => (
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
                    {index < reportData.securityReports.length - 1 && <Divider />}
                  </React.Fragment>
                ))
              ) : (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Alert severity="info">
                    No security reports available. Connect to a tenant to view security information.
                  </Alert>
                </Box>
              )}
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