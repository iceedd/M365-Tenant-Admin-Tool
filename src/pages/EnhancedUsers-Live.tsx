import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Tabs, Tab, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Avatar, Chip, IconButton, TextField, InputAdornment,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress,
  Grid, Card, CardContent, Menu, MenuItem, Tooltip, Switch, FormControlLabel
} from '@mui/material';
import {
  Search, FilterList, Refresh, PersonAdd, MoreVert, Edit, Delete,
  Email, Phone, Business, LocationOn, Check, Close, AdminPanelSettings
} from '@mui/icons-material';
import { getDataService } from '../services/dataService';
import type { User } from '@microsoft/microsoft-graph-types';
import UserCreationForm from '../components/users/UserCreationForm';

const EnhancedUsersLive: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDetailDialog, setUserDetailDialog] = useState(false);
  const [actionMenu, setActionMenu] = useState<{ anchorEl: HTMLElement | null; user: User | null }>({
    anchorEl: null,
    user: null
  });

  const dataService = getDataService();

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const usersData = await dataService.getUsers();
      setUsers(usersData);
      setFilteredUsers(usersData);
      console.log(`Loaded ${usersData.length} users from ${dataService.isUsingRealApi() ? 'Graph API' : 'mock data'}`);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError(`Failed to load users: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    // Filter users based on search term
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.userPrincipalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.mail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setActionMenu({ anchorEl: event.currentTarget, user });
  };

  const handleActionMenuClose = () => {
    setActionMenu({ anchorEl: null, user: null });
  };

  const handleUserDetail = (user: User) => {
    setSelectedUser(user);
    setUserDetailDialog(true);
    handleActionMenuClose();
  };

  const formatUserStatus = (user: User) => {
    const isEnabled = user.accountEnabled;
    return {
      label: isEnabled ? 'Active' : 'Disabled',
      color: isEnabled ? 'success' : 'error' as any
    };
  };

  const formatUserType = (user: User) => {
    // Determine user type based on userType and other properties
    if (user.userType === 'Guest') return { label: 'Guest', color: 'warning' as any };
    if (user.assignedLicenses && user.assignedLicenses.length > 0) return { label: 'Licensed', color: 'primary' as any };
    return { label: 'Unlicensed', color: 'default' as any };
  };

  const UserStatsCards = () => {
    const stats = {
      total: users.length,
      active: users.filter(u => u.accountEnabled !== false).length,
      licensed: users.filter(u => u.assignedLicenses && u.assignedLicenses.length > 0).length,
      guests: users.filter(u => u.userType === 'Guest').length,
      admins: users.filter(u => u.assignedLicenses?.some(l => 
        l.skuId && ['ENTERPRISEPACK', 'SPE_E3', 'SPE_E5'].includes(l.skuId)
      )).length
    };

    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">Total Users</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                {stats.active}
              </Typography>
              <Typography variant="body2" color="text.secondary">Active Users</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold' }}>
                {stats.licensed}
              </Typography>
              <Typography variant="body2" color="text.secondary">Licensed</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                {stats.guests}
              </Typography>
              <Typography variant="body2" color="text.secondary">Guest Users</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="secondary.main" sx={{ fontWeight: 'bold' }}>
                {stats.admins}
              </Typography>
              <Typography variant="body2" color="text.secondary">Admin Licenses</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const UserListTab = () => {
    if (error) {
      return (
        <Box sx={{ p: 3 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button variant="contained" startIcon={<Refresh />} onClick={loadUsers}>
            Retry
          </Button>
        </Box>
      );
    }

    return (
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            User Directory {dataService.isUsingRealApi() ? '(Live Data)' : '(Demo Data)'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadUsers}
              disabled={isLoading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<PersonAdd />}
              onClick={() => setActiveTab(0)}
            >
              Add User
            </Button>
          </Box>
        </Box>

        <UserStatsCards />

        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Search users by name, email, job title, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Job Title</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {user.displayName?.charAt(0) || user.userPrincipalName?.charAt(0) || '?'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {user.displayName || 'No Name'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.userPrincipalName}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {user.mail && (
                          <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Email sx={{ fontSize: 14 }} />
                            {user.mail}
                          </Typography>
                        )}
                        {user.businessPhones && user.businessPhones[0] && (
                          <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Phone sx={{ fontSize: 14 }} />
                            {user.businessPhones[0]}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={formatUserStatus(user).label}
                        color={formatUserStatus(user).color}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={formatUserType(user).label}
                        color={formatUserType(user).color}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.department || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.jobTitle || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => handleActionMenuOpen(e, user)}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        {searchTerm ? 'No users match your search criteria' : 'No users found'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          User Management
        </Typography>
        {dataService.isUsingRealApi() && (
          <Alert severity="success" sx={{ py: 0 }}>
            Connected to Microsoft Graph API
          </Alert>
        )}
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Create User" />
          <Tab label="User Directory" />
          <Tab label="Bulk Operations" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && <UserCreationForm />}
      {activeTab === 1 && <UserListTab />}
      
      {activeTab === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Bulk Operations</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Perform bulk operations on multiple users at once.
          </Typography>
          <Alert severity="info">
            Bulk operations feature coming soon. This will include CSV import, bulk updates, license assignment, and mass operations.
          </Alert>
        </Paper>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenu.anchorEl}
        open={Boolean(actionMenu.anchorEl)}
        onClose={handleActionMenuClose}
      >
        <MenuItem onClick={() => actionMenu.user && handleUserDetail(actionMenu.user)}>
          <Edit sx={{ mr: 1 }} fontSize="small" />
          View Details
        </MenuItem>
        <MenuItem onClick={handleActionMenuClose}>
          <AdminPanelSettings sx={{ mr: 1 }} fontSize="small" />
          Manage Licenses
        </MenuItem>
        <MenuItem onClick={handleActionMenuClose}>
          <Delete sx={{ mr: 1 }} fontSize="small" />
          Disable User
        </MenuItem>
      </Menu>

      {/* User Detail Dialog */}
      <Dialog
        open={userDetailDialog}
        onClose={() => setUserDetailDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          User Details
          {selectedUser && (
            <Typography variant="body2" color="text.secondary">
              {selectedUser.userPrincipalName}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Basic Information</Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Display Name</Typography>
                  <Typography variant="body1">{selectedUser.displayName || 'N/A'}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Email</Typography>
                  <Typography variant="body1">{selectedUser.mail || 'N/A'}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">User Principal Name</Typography>
                  <Typography variant="body1">{selectedUser.userPrincipalName || 'N/A'}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Account Status</Typography>
                  <Chip
                    size="small"
                    label={formatUserStatus(selectedUser).label}
                    color={formatUserStatus(selectedUser).color}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Work Information</Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Job Title</Typography>
                  <Typography variant="body1">{selectedUser.jobTitle || 'N/A'}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Department</Typography>
                  <Typography variant="body1">{selectedUser.department || 'N/A'}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Office Location</Typography>
                  <Typography variant="body1">{selectedUser.officeLocation || 'N/A'}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Business Phone</Typography>
                  <Typography variant="body1">
                    {selectedUser.businessPhones && selectedUser.businessPhones[0] ? selectedUser.businessPhones[0] : 'N/A'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>Licenses</Typography>
                {selectedUser.assignedLicenses && selectedUser.assignedLicenses.length > 0 ? (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {selectedUser.assignedLicenses.map((license, index) => (
                      <Chip
                        key={index}
                        label={license.skuId || `License ${index + 1}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">No licenses assigned</Typography>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDetailDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnhancedUsersLive;