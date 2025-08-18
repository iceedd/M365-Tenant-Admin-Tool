import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import {
  History,
  PersonAdd,
  GroupAdd,
  Assignment,
  Refresh,
  Search,
  GetApp,
  CheckCircle,
  Warning,
  Error,
  Person,
  Group,
  Business
} from '@mui/icons-material';
import { getDataService } from '../../services/dataService';
import type { DirectoryAudit } from '@microsoft/microsoft-graph-types';

// Enhanced activity data structure
interface ActivityLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  result: 'Success' | 'Warning' | 'Failure';
  category: string;
  details?: string;
  ipAddress?: string;
}

const ActivityManagementLive: React.FC = () => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [timeRange, setTimeRange] = useState(30); // days
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showRefreshSuccess, setShowRefreshSuccess] = useState(false);
  const [showExportSuccess, setShowExportSuccess] = useState(false);

  const dataService = getDataService();

  // Transform DirectoryAudit to ActivityLog
  const transformAuditToActivity = (audit: DirectoryAudit): ActivityLog => {
    const actor = audit.initiatedBy?.user?.displayName || 
                 audit.initiatedBy?.app?.displayName || 
                 'System';
    
    const action = audit.activityDisplayName || 'Unknown Activity';
    const resource = audit.targetResources?.[0]?.displayName || 
                    audit.targetResources?.[0]?.userPrincipalName || 
                    'Unknown Resource';
    
    let result: 'Success' | 'Warning' | 'Failure' = 'Success';
    if (audit.result === 'failure') result = 'Failure';
    else if (audit.result === 'timeout' || audit.result === 'unknown') result = 'Warning';
    
    let category = 'General';
    if (audit.category === 'UserManagement') category = 'User Management';
    else if (audit.category === 'GroupManagement') category = 'Group Management';
    else if (audit.category === 'ApplicationManagement') category = 'Application Management';
    else if (audit.category === 'RoleManagement') category = 'Role Management';
    else if (audit.category === 'DirectoryManagement') category = 'Directory Management';

    return {
      id: audit.id || Math.random().toString(),
      timestamp: audit.activityDateTime || new Date().toISOString(),
      actor,
      action,
      resource,
      result,
      category,
      details: audit.additionalDetails?.map(d => `${d.key}: ${d.value}`).join(', '),
      ipAddress: audit.initiatedBy?.user?.ipAddress
    };
  };

  const loadActivities = async () => {
    try {
      console.log(`🔄 Loading audit logs for the last ${timeRange} days...`);
      const auditData = await dataService.getAuditLogs(timeRange);
      
      const transformedActivities = auditData.map(transformAuditToActivity);
      setActivities(transformedActivities);
      setFilteredActivities(transformedActivities);
      
      console.log(`✅ Loaded ${transformedActivities.length} activities from ${dataService.isUsingRealApi() ? 'Graph API' : 'mock data'}`);
    } catch (err) {
      console.error('❌ Failed to load activities:', err);
      setError(`Failed to load activities: ${err}`);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      await loadActivities();
      setShowRefreshSuccess(true);
    } catch (error) {
      console.error('Failed to refresh activities:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      console.log('📊 Exporting audit logs...');
      
      const csvContent = [
        'Timestamp,Actor,Action,Resource,Result,Category,IP Address,Details',
        ...filteredActivities.map(activity => 
          `"${activity.timestamp}","${activity.actor}","${activity.action}","${activity.resource}","${activity.result}","${activity.category}","${activity.ipAddress || 'N/A'}","${activity.details || 'N/A'}"`
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);

      setShowExportSuccess(true);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleTimeRangeChange = (newRange: number) => {
    setTimeRange(newRange);
    setIsLoading(true);
    loadActivities().finally(() => setIsLoading(false));
  };

  useEffect(() => {
    const initializeActivities = async () => {
      setIsLoading(true);
      await loadActivities();
      setIsLoading(false);
    };

    initializeActivities();
  }, [timeRange]);

  useEffect(() => {
    // Filter activities based on search and category
    let filtered = activities;
    
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(activity =>
        activity.actor.toLowerCase().includes(search) ||
        activity.action.toLowerCase().includes(search) ||
        activity.resource.toLowerCase().includes(search)
      );
    }
    
    if (filterCategory !== 'all') {
      filtered = filtered.filter(activity => activity.category === filterCategory);
    }
    
    setFilteredActivities(filtered);
  }, [searchTerm, filterCategory, activities]);

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'Success': return <CheckCircle sx={{ color: 'success.main' }} />;
      case 'Warning': return <Warning sx={{ color: 'warning.main' }} />;
      case 'Failure': return <Error sx={{ color: 'error.main' }} />;
      default: return <CheckCircle />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'User Management': return <Person color="primary" />;
      case 'Group Management': return <Group color="secondary" />;
      case 'Application Management': return <Business color="info" />;
      default: return <History color="action" />;
    }
  };

  const categories = Array.from(new Set(activities.map(a => a.category)));
  
  const stats = {
    total: activities.length,
    success: activities.filter(a => a.result === 'Success').length,
    warnings: activities.filter(a => a.result === 'Warning').length,
    failures: activities.filter(a => a.result === 'Failure').length
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6">Loading Activity Logs...</Typography>
          <Typography variant="body2" color="text.secondary">
            Fetching audit data for the last {timeRange} days...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" startIcon={<Refresh />} onClick={handleRefresh}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Activity Logs & Audit Trail
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {dataService.isUsingRealApi() ? 'Live audit data from Microsoft Graph API' : 'Demo data (Azure AD not configured)'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={isExporting ? <CircularProgress size={20} /> : <GetApp />}
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
          <Button
            variant="contained"
            startIcon={isRefreshing ? <CircularProgress size={20} /> : <Refresh />}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <History sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">Total Activities</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">Last {timeRange} days</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircle sx={{ color: 'success.main', mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">Successful</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {stats.success}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0}% success rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Warning sx={{ color: 'warning.main', mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">Warnings</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {stats.warnings}
              </Typography>
              <Typography variant="body2" color="text.secondary">Requires attention</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Error sx={{ color: 'error.main', mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">Failures</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {stats.failures}
              </Typography>
              <Typography variant="body2" color="text.secondary">Need investigation</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
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
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={filterCategory}
                  label="Category"
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {categories.map(cat => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={timeRange}
                  label="Time Range"
                  onChange={(e) => handleTimeRangeChange(Number(e.target.value))}
                >
                  <MenuItem value={1}>Last 24 hours</MenuItem>
                  <MenuItem value={7}>Last 7 days</MenuItem>
                  <MenuItem value={30}>Last 30 days</MenuItem>
                  <MenuItem value={90}>Last 90 days</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2" color="text.secondary">
                Showing {filteredActivities.length} of {activities.length}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Activity Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Recent Activity
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Actor</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Resource</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Result</TableCell>
                  <TableCell>IP Address</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredActivities.slice(0, 100).map((activity) => (
                  <TableRow key={activity.id} hover>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(activity.timestamp).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {activity.actor.charAt(0)}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {activity.actor}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {activity.action}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {activity.resource}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getCategoryIcon(activity.category)}
                        <Typography variant="body2">
                          {activity.category}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getResultIcon(activity.result)}
                        <Chip
                          label={activity.result}
                          size="small"
                          color={
                            activity.result === 'Success' ? 'success' :
                            activity.result === 'Warning' ? 'warning' : 'error'
                          }
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {activity.ipAddress || 'N/A'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredActivities.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        {searchTerm || filterCategory !== 'all' ? 
                          'No activities match your search criteria' : 
                          'No activities found for the selected time range'
                        }
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Success Snackbars */}
      <Snackbar
        open={showRefreshSuccess}
        autoHideDuration={3000}
        onClose={() => setShowRefreshSuccess(false)}
        message="Activity logs refreshed successfully"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      />

      <Snackbar
        open={showExportSuccess}
        autoHideDuration={3000}
        onClose={() => setShowExportSuccess(false)}
        message="Activity logs exported successfully"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      />
    </Box>
  );
};

export default ActivityManagementLive;