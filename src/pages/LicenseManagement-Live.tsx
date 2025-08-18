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
  LinearProgress,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Assignment,
  People,
  TrendingUp,
  Warning,
  CheckCircle,
  Refresh,
  Add,
  Remove,
  Search,
  GetApp
} from '@mui/icons-material';
import { getDataService } from '../services/dataService';
import type { User, SubscribedSku } from '@microsoft/microsoft-graph-types';

interface LicenseAssignment {
  userId: string;
  userDisplayName: string;
  userPrincipalName: string;
  skuId: string;
  skuPartNumber: string;
  assignedDateTime: string;
}

const LicenseManagementLive: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [licenses, setLicenses] = useState<SubscribedSku[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [licenseAssignments, setLicenseAssignments] = useState<LicenseAssignment[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedLicense, setSelectedLicense] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const dataService = getDataService();

  const loadLicenseData = async () => {
    try {
      console.log('🔄 Loading license management data...');
      
      // Load licenses and users in parallel
      const [licensesData, usersData] = await Promise.all([
        dataService.getSubscribedSkus().catch(err => { console.warn('Licenses failed:', err); return []; }),
        dataService.getUsers(['id', 'displayName', 'userPrincipalName', 'assignedLicenses', 'usageLocation']).catch(err => { console.warn('Users failed:', err); return []; })
      ]);

      setLicenses(licensesData);
      setUsers(usersData);

      // Transform user license assignments
      const assignments: LicenseAssignment[] = [];
      usersData.forEach(user => {
        if (user.assignedLicenses) {
          user.assignedLicenses.forEach(assignment => {
            const license = licensesData.find(l => l.skuId === assignment.skuId);
            if (license) {
              assignments.push({
                userId: user.id || '',
                userDisplayName: user.displayName || '',
                userPrincipalName: user.userPrincipalName || '',
                skuId: assignment.skuId || '',
                skuPartNumber: license.skuPartNumber || '',
                assignedDateTime: new Date().toISOString() // Graph API doesn't provide assignment date in basic call
              });
            }
          });
        }
      });

      setLicenseAssignments(assignments);

      console.log(`✅ License data loaded:`, {
        licenses: licensesData.length,
        users: usersData.length,
        assignments: assignments.length,
        usingRealAPI: dataService.isUsingRealApi()
      });

    } catch (err) {
      console.error('❌ Failed to load license data:', err);
      setError(`Failed to load license data: ${err}`);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    await loadLicenseData();
    setIsRefreshing(false);
  };

  const handleAssignLicense = async () => {
    if (!selectedUser || !selectedLicense) return;

    try {
      console.log(`🔄 Assigning license ${selectedLicense} to user ${selectedUser.displayName}...`);
      
      // In a real implementation, this would call Graph API to assign the license
      // For now, we'll simulate the assignment
      const newAssignment: LicenseAssignment = {
        userId: selectedUser.id || '',
        userDisplayName: selectedUser.displayName || '',
        userPrincipalName: selectedUser.userPrincipalName || '',
        skuId: selectedLicense,
        skuPartNumber: licenses.find(l => l.skuId === selectedLicense)?.skuPartNumber || '',
        assignedDateTime: new Date().toISOString()
      };

      setLicenseAssignments(prev => [...prev, newAssignment]);
      setShowAssignDialog(false);
      setSelectedUser(null);
      setSelectedLicense('');

      console.log('✅ License assigned successfully (simulated)');
    } catch (err) {
      console.error('❌ Failed to assign license:', err);
    }
  };

  const handleRemoveLicense = async (assignment: LicenseAssignment) => {
    try {
      console.log(`🔄 Removing license ${assignment.skuPartNumber} from user ${assignment.userDisplayName}...`);
      
      // In a real implementation, this would call Graph API to remove the license
      setLicenseAssignments(prev => 
        prev.filter(a => !(a.userId === assignment.userId && a.skuId === assignment.skuId))
      );

      console.log('✅ License removed successfully (simulated)');
    } catch (err) {
      console.error('❌ Failed to remove license:', err);
    }
  };

  useEffect(() => {
    const initializeLicenseData = async () => {
      setIsLoading(true);
      await loadLicenseData();
      setIsLoading(false);
    };

    initializeLicenseData();
  }, []);

  // Calculate license statistics
  const licenseStats = {
    totalLicenses: licenses.reduce((sum, sku) => sum + (sku.prepaidUnits?.enabled || 0), 0),
    assignedLicenses: licenses.reduce((sum, sku) => sum + (sku.consumedUnits || 0), 0),
    availableLicenses: licenses.reduce((sum, sku) => sum + ((sku.prepaidUnits?.enabled || 0) - (sku.consumedUnits || 0)), 0),
    uniqueUsers: new Set(licenseAssignments.map(a => a.userId)).size
  };

  // Filter license assignments based on search
  const filteredAssignments = licenseAssignments.filter(assignment =>
    assignment.userDisplayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.userPrincipalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.skuPartNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6">Loading License Management...</Typography>
          <Typography variant="body2" color="text.secondary">
            Fetching licenses and user assignments...
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
            License Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {dataService.isUsingRealApi() ? 'Live license data from Microsoft Graph API' : 'Demo data (Azure AD not configured)'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => setShowAssignDialog(true)}
          >
            Assign License
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

      {/* License Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Assignment sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">Total Licenses</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {licenseStats.totalLicenses}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Across {licenses.length} SKUs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircle sx={{ color: 'success.main', mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">Assigned</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {licenseStats.assignedLicenses}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {licenseStats.totalLicenses > 0 ? Math.round((licenseStats.assignedLicenses / licenseStats.totalLicenses) * 100) : 0}% utilization
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUp sx={{ color: 'info.main', mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">Available</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {licenseStats.availableLicenses}
              </Typography>
              <Typography variant="body2" color="text.secondary">Ready to assign</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <People sx={{ color: 'secondary.main', mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">Licensed Users</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {licenseStats.uniqueUsers}
              </Typography>
              <Typography variant="body2" color="text.secondary">Unique users</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* License Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                License Utilization Overview
              </Typography>
              {licenses.length > 0 ? (
                licenses.map((license) => {
                  const total = license.prepaidUnits?.enabled || 0;
                  const used = license.consumedUnits || 0;
                  const available = total - used;
                  const utilization = total > 0 ? (used / total) * 100 : 0;

                  return (
                    <Box key={license.skuId} sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {license.skuPartNumber}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {used} / {total} ({utilization.toFixed(1)}%)
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={utilization}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            backgroundColor: utilization > 90 ? 'error.main' : utilization > 75 ? 'warning.main' : 'success.main'
                          }
                        }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Available: {available}
                        </Typography>
                        <Chip
                          label={utilization > 90 ? 'Critical' : utilization > 75 ? 'High' : 'Good'}
                          size="small"
                          color={utilization > 90 ? 'error' : utilization > 75 ? 'warning' : 'success'}
                        />
                      </Box>
                    </Box>
                  );
                })
              ) : (
                <Alert severity="info">
                  No license information available
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setShowAssignDialog(true)}
                  fullWidth
                >
                  Assign License to User
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<GetApp />}
                  fullWidth
                >
                  Export License Report
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Search />}
                  fullWidth
                >
                  Audit License Usage
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* License Assignments */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              User License Assignments
            </Typography>
            <TextField
              size="small"
              placeholder="Search users or licenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>License</TableCell>
                  <TableCell>Assigned Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAssignments.slice(0, 100).map((assignment, index) => (
                  <TableRow key={`${assignment.userId}-${assignment.skuId}-${index}`} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {assignment.userDisplayName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {assignment.userPrincipalName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={assignment.skuPartNumber}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(assignment.assignedDateTime).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        startIcon={<Remove />}
                        color="error"
                        onClick={() => handleRemoveLicense(assignment)}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredAssignments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        {searchTerm ? 'No assignments match your search criteria' : 'No license assignments found'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Assign License Dialog */}
      <Dialog open={showAssignDialog} onClose={() => setShowAssignDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign License to User</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Autocomplete
              options={users}
              getOptionLabel={(user) => `${user.displayName} (${user.userPrincipalName})`}
              value={selectedUser}
              onChange={(_, newValue) => setSelectedUser(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Select User" fullWidth />
              )}
            />
            
            <FormControl fullWidth>
              <InputLabel>Select License</InputLabel>
              <Select
                value={selectedLicense}
                label="Select License"
                onChange={(e) => setSelectedLicense(e.target.value)}
              >
                {licenses.filter(license => (license.prepaidUnits?.enabled || 0) > (license.consumedUnits || 0)).map((license) => (
                  <MenuItem key={license.skuId} value={license.skuId}>
                    {license.skuPartNumber} ({((license.prepaidUnits?.enabled || 0) - (license.consumedUnits || 0))} available)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAssignDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleAssignLicense}
            disabled={!selectedUser || !selectedLicense}
          >
            Assign License
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LicenseManagementLive;