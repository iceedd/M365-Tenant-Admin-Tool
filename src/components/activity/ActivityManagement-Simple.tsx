import React, { useState } from 'react';
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

// Simplified activity data structure
interface SimpleActivity {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  result: 'Success' | 'Warning' | 'Failure';
  category: string;
}

// Mock data - much simpler
const mockActivities: SimpleActivity[] = [
  {
    id: '1',
    timestamp: new Date().toISOString(),
    actor: 'Sarah Wilson',
    action: 'Created new user account',
    resource: 'John Smith',
    result: 'Success',
    category: 'User Management'
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    actor: 'Mike Johnson',
    action: 'Added members to group',
    resource: 'IT Department',
    result: 'Success',
    category: 'Group Management'
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    actor: 'David Brown',
    action: 'Failed to reset password',
    resource: 'External User',
    result: 'Failure',
    category: 'Security'
  }
];

const ActivityManagementSimple: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showRefreshSuccess, setShowRefreshSuccess] = useState(false);
  const [showExportSuccess, setShowExportSuccess] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Simulate API call to refresh activity logs
      console.log('Refreshing activity logs...');
      
      // In a real implementation, this would:
      // 1. Call Microsoft Graph API: GET /auditLogs/directoryAudits
      // 2. Update the activities state with fresh data
      // 3. Refresh statistics and counts
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Activity logs refreshed successfully');
      setShowRefreshSuccess(true);
    } catch (error) {
      console.error('Failed to refresh activity logs:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Simulate export process
      console.log('Exporting activity logs...');
      
      // Create CSV content
      const csvHeaders = ['Timestamp', 'Actor', 'Action', 'Resource', 'Result', 'Category'];
      const csvData = filteredActivities.map(activity => [
        new Date(activity.timestamp).toLocaleString(),
        activity.actor,
        activity.action,
        activity.resource,
        activity.result,
        activity.category
      ]);
      
      const csvContent = [
        csvHeaders.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `activity_logs_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Activity logs exported successfully');
      setShowExportSuccess(true);
    } catch (error) {
      console.error('Failed to export activity logs:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const filteredActivities = mockActivities.filter(activity => {
    const matchesSearch = activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.actor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || activity.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getResultColor = (result: string) => {
    switch (result) {
      case 'Success': return 'success';
      case 'Warning': return 'warning';
      case 'Failure': return 'error';
      default: return 'default';
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('Created') || action.includes('user')) return <PersonAdd />;
    if (action.includes('group')) return <GroupAdd />;
    if (action.includes('license')) return <Assignment />;
    return <History />;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Activity Logs
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={isExporting ? <CircularProgress size={20} /> : <GetApp />}
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export'}
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

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <History color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Total Activities
                </Typography>
              </Box>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                {mockActivities.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircle color="success" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Successful
                </Typography>
              </Box>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                {mockActivities.filter(a => a.result === 'Success').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Warning color="warning" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Warnings
                </Typography>
              </Box>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                {mockActivities.filter(a => a.result === 'Warning').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Error color="error" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Failures
                </Typography>
              </Box>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                {mockActivities.filter(a => a.result === 'Failure').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
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
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={filterCategory}
                  label="Category"
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  <MenuItem value="User Management">User Management</MenuItem>
                  <MenuItem value="Group Management">Group Management</MenuItem>
                  <MenuItem value="Security">Security</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2" color="text.secondary">
                {filteredActivities.length} results
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Activity List */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Activities
          </Typography>
          
          {filteredActivities.length === 0 ? (
            <Alert severity="info">
              No activities found matching your criteria.
            </Alert>
          ) : (
            <List>
              {filteredActivities.map((activity, index) => (
                <React.Fragment key={activity.id}>
                  <ListItem>
                    <ListItemIcon>
                      {getActionIcon(activity.action)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body1">
                            <strong>{activity.actor}</strong> {activity.action.toLowerCase()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(activity.timestamp).toLocaleTimeString()}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Typography variant="body2" color="text.secondary">
                            Resource: {activity.resource}
                          </Typography>
                          <Chip
                            label={activity.result}
                            size="small"
                            color={getResultColor(activity.result) as any}
                          />
                          <Chip
                            label={activity.category}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < filteredActivities.length - 1 && (
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mx: 2 }} />
                  )}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Table View */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Activity Table
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell>Actor</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Resource</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Result</TableCell>
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
                          {activity.actor.charAt(0)}
                        </Avatar>
                        <Typography variant="body2">
                          {activity.actor}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getActionIcon(activity.action)}
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          {activity.action}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{activity.resource}</TableCell>
                    <TableCell>
                      <Chip
                        label={activity.category}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={activity.result}
                        size="small"
                        color={getResultColor(activity.result) as any}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Success Notifications */}
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
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />
    </Box>
  );
};

export default ActivityManagementSimple;