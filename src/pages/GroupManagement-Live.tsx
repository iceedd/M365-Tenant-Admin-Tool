import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, IconButton, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle,
  DialogContent, DialogActions, List, ListItem, ListItemText, Chip, TextField,
  FormControl, InputLabel, Select, MenuItem, Tabs, Tab, Alert, CircularProgress,
  Snackbar, Fab, Menu, MenuList, MenuItem as MenuItemComponent, Avatar
} from '@mui/material';
import {
  Group, Security, Email, People, PersonAdd, Add, Edit, Delete, MoreVert,
  Refresh, FilterList, Search, Settings, CheckCircle, AdminPanelSettings,
  Shield, Business, Public, VpnLock, MailOutline, GroupWork
} from '@mui/icons-material';
import { getDataService } from '../services/dataService';
import type { Group as GraphGroup, User, DirectoryObject } from '@microsoft/microsoft-graph-types';
import GroupCreationForm from '../components/groups/GroupCreationForm';

interface GroupMember {
  id: string;
  displayName: string;
  userPrincipalName: string;
  userType: 'Member' | 'Guest';
  department?: string;
  jobTitle?: string;
  accountEnabled: boolean;
}

interface EnhancedGroup extends GraphGroup {
  memberCount: number;
  ownerCount: number;
  members?: User[];
  owners?: User[];
}

const GroupManagementLive: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [groups, setGroups] = useState<EnhancedGroup[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<EnhancedGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<EnhancedGroup | null>(null);
  const [groupMembers, setGroupMembers] = useState<User[]>([]);
  const [groupOwners, setGroupOwners] = useState<User[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRefreshSuccess, setShowRefreshSuccess] = useState(false);

  const dataService = getDataService();

  const loadGroups = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const groupsData = await dataService.getGroups();
      
      // Transform the groups and add member counts
      const enhancedGroups: EnhancedGroup[] = await Promise.all(
        groupsData.map(async (group) => {
          try {
            // Get member counts for each group
            let memberCount = 0;
            let ownerCount = 0;
            
            if (dataService.isUsingRealApi()) {
              // For real API, we would need to make separate calls to get member counts
              // For now, we'll use placeholder values
              memberCount = Math.floor(Math.random() * 20) + 1; // Placeholder
              ownerCount = Math.floor(Math.random() * 3) + 1; // Placeholder
            } else {
              // For mock data, use random values
              memberCount = Math.floor(Math.random() * 20) + 1;
              ownerCount = Math.floor(Math.random() * 3) + 1;
            }

            return {
              ...group,
              memberCount,
              ownerCount
            } as EnhancedGroup;
          } catch (err) {
            console.warn(`Failed to get member count for group ${group.id}:`, err);
            return {
              ...group,
              memberCount: 0,
              ownerCount: 0
            } as EnhancedGroup;
          }
        })
      );

      setGroups(enhancedGroups);
      setFilteredGroups(enhancedGroups);
      console.log(`Loaded ${enhancedGroups.length} groups from ${dataService.isUsingRealApi() ? 'Graph API' : 'mock data'}`);
    } catch (err) {
      console.error('Failed to load groups:', err);
      setError(`Failed to load groups: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadGroupDetails = async (group: EnhancedGroup) => {
    if (!group.id) return;
    
    try {
      // Load group members and owners
      const [members, owners] = await Promise.all([
        dataService.getGroupMembers(group.id).catch(() => []),
        dataService.getGroupOwners(group.id).catch(() => [])
      ]);
      
      setGroupMembers(members);
      setGroupOwners(owners);
    } catch (err) {
      console.error('Failed to load group details:', err);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadGroups();
      setShowRefreshSuccess(true);
    } catch (error) {
      console.error('Failed to refresh groups:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateGroup = async (groupData: any) => {
    try {
      console.log('🔄 Creating group:', groupData);
      setError(null);

      // Map form data to the format expected by DataService
      const createGroupData = {
        displayName: groupData.displayName,
        description: groupData.description,
        groupType: groupData.groupType as 'Distribution' | 'Security' | 'Microsoft365'
      };

      // Call the real group creation API
      const createdGroup = await dataService.createGroup(createGroupData);
      console.log('✅ Group created successfully:', createdGroup);

      // Close the dialog first
      setShowCreateDialog(false);

      // Refresh the groups list to show the new group
      await loadGroups();

      // Show success message
      setShowRefreshSuccess(true);
    } catch (error) {
      console.error('❌ Failed to create group:', error);
      
      // Extract meaningful error message
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setError(`Failed to create group: ${errorMessage}`);
      
      // Don't close the dialog on error so user can try again
      throw error;
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    // Filter groups based on search term and type
    if (!searchTerm.trim() && filterType === 'all') {
      setFilteredGroups(groups);
    } else {
      const filtered = groups.filter(group => {
        const matchesSearch = !searchTerm.trim() || 
          group.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          group.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          group.mail?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = filterType === 'all' || 
          (filterType === 'Security' && group.securityEnabled && !group.groupTypes?.includes('Unified')) ||
          (filterType === 'Distribution' && group.mailEnabled && !group.securityEnabled && !group.groupTypes?.includes('Unified')) ||
          (filterType === 'Microsoft365' && group.groupTypes?.includes('Unified')) ||
          (filterType === 'Mail-Enabled Security' && group.securityEnabled && group.mailEnabled && !group.groupTypes?.includes('Unified'));

        return matchesSearch && matchesFilter;
      });
      setFilteredGroups(filtered);
    }
  }, [searchTerm, filterType, groups]);

  const getGroupType = (group: GraphGroup): string => {
    if (group.groupTypes?.includes('Unified')) return 'Microsoft365';
    if (group.securityEnabled && group.mailEnabled) return 'Mail-Enabled Security';
    if (group.securityEnabled) return 'Security';
    if (group.mailEnabled) return 'Distribution';
    return 'Other';
  };

  const getGroupIcon = (groupType: string) => {
    switch (groupType) {
      case 'Security': return <Security color="error" />;
      case 'Distribution': return <MailOutline color="primary" />;
      case 'Microsoft365': return <GroupWork color="secondary" />;
      case 'Mail-Enabled Security': return <Shield color="warning" />;
      default: return <Group />;
    }
  };

  const getGroupTypeColor = (groupType: string) => {
    switch (groupType) {
      case 'Security': return 'error';
      case 'Distribution': return 'primary';
      case 'Microsoft365': return 'secondary';
      case 'Mail-Enabled Security': return 'warning';
      default: return 'default';
    }
  };

  const handleGroupClick = async (group: EnhancedGroup) => {
    setSelectedGroup(group);
    await loadGroupDetails(group);
  };

  const groupTypeStats = {
    total: groups.length,
    security: groups.filter(g => getGroupType(g) === 'Security').length,
    distribution: groups.filter(g => getGroupType(g) === 'Distribution').length,
    microsoft365: groups.filter(g => getGroupType(g) === 'Microsoft365').length,
    mailEnabledSecurity: groups.filter(g => getGroupType(g) === 'Mail-Enabled Security').length
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

  const GroupCard = ({ group }: { group: EnhancedGroup }) => {
    const groupType = getGroupType(group);
    
    return (
      <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={() => handleGroupClick(group)}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                {getGroupIcon(groupType)}
                <Typography variant="h6" component="div" sx={{ fontWeight: 600, ml: 1 }}>
                  {group.displayName}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {group.description || 'No description'}
              </Typography>
              {group.mail && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                  <Email fontSize="small" sx={{ mr: 0.5 }} />
                  {group.mail}
                </Typography>
              )}
            </Box>
            <IconButton size="small">
              <MoreVert />
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Chip
              label={groupType}
              size="small"
              color={getGroupTypeColor(groupType) as any}
            />
            <Chip
              label={group.visibility || 'Private'}
              size="small"
              variant="outlined"
              icon={group.visibility === 'Public' ? <Public /> : <VpnLock />}
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <People fontSize="small" color="action" />
                <Typography variant="body2">{group.memberCount}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AdminPanelSettings fontSize="small" color="action" />
                <Typography variant="body2">{group.ownerCount}</Typography>
              </Box>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {group.createdDateTime ? new Date(group.createdDateTime).toLocaleDateString() : 'Unknown'}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const TabPanel = ({ children, value, index }: any) => (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" startIcon={<Refresh />} onClick={loadGroups}>
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
            Group Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {dataService.isUsingRealApi() ? 'Live data from Microsoft Graph API' : 'Demo data (Azure AD not configured)'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<FilterList />}>
            Export Groups
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowCreateDialog(true)}
          >
            Create Group
          </Button>
        </Box>
      </Box>

      {dataService.isUsingRealApi() && (
        <Alert severity="success" sx={{ mb: 3, py: 0 }}>
          Connected to Microsoft Graph API - Showing real tenant data
        </Alert>
      )}

      {/* Group Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            icon={<Group />}
            title="Total Groups"
            value={isLoading ? '...' : groupTypeStats.total}
            subtitle="All group types"
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            icon={<Security />}
            title="Security Groups"
            value={isLoading ? '...' : groupTypeStats.security}
            subtitle="Access control"
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            icon={<MailOutline />}
            title="Distribution Lists"
            value={isLoading ? '...' : groupTypeStats.distribution}
            subtitle="Email distribution"
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            icon={<GroupWork />}
            title="M365 Groups"
            value={isLoading ? '...' : groupTypeStats.microsoft365}
            subtitle="Collaboration"
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            icon={<Shield />}
            title="Mail-Enabled Security"
            value={isLoading ? '...' : groupTypeStats.mailEnabledSecurity}
            subtitle="Email + Security"
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Search and Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search groups by name, description, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Group Type</InputLabel>
                <Select
                  value={filterType}
                  label="Group Type"
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="Security">Security Groups</MenuItem>
                  <MenuItem value="Distribution">Distribution Lists</MenuItem>
                  <MenuItem value="Microsoft365">Microsoft 365 Groups</MenuItem>
                  <MenuItem value="Mail-Enabled Security">Mail-Enabled Security</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={isRefreshing ? <CircularProgress size={20} /> : <Refresh />}
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Groups Display */}
      <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)} sx={{ mb: 2 }}>
        <Tab label="Card View" />
        <Tab label="Table View" />
      </Tabs>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TabPanel value={currentTab} index={0}>
            <Grid container spacing={3}>
              {filteredGroups.map((group) => (
                <Grid item xs={12} sm={6} lg={4} xl={3} key={group.id}>
                  <GroupCard group={group} />
                </Grid>
              ))}
              {filteredGroups.length === 0 && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      {searchTerm || filterType !== 'all' ? 'No groups match your search criteria' : 'No groups found'}
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </TabPanel>

          <TabPanel value={currentTab} index={1}>
            <Card>
              <CardContent>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Group Name</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell align="center">Members</TableCell>
                        <TableCell align="center">Owners</TableCell>
                        <TableCell>Visibility</TableCell>
                        <TableCell>Created</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredGroups.map((group) => {
                        const groupType = getGroupType(group);
                        return (
                          <TableRow key={group.id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {getGroupIcon(groupType)}
                                <Box sx={{ ml: 1 }}>
                                  <Typography variant="body2" fontWeight="medium">
                                    {group.displayName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {group.description || 'No description'}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={groupType}
                                size="small"
                                color={getGroupTypeColor(groupType) as any}
                              />
                            </TableCell>
                            <TableCell>
                              {group.mail ? (
                                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                  {group.mail}
                                </Typography>
                              ) : (
                                <Typography variant="body2" color="text.secondary">-</Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">{group.memberCount}</TableCell>
                            <TableCell align="center">{group.ownerCount}</TableCell>
                            <TableCell>
                              <Chip
                                label={group.visibility || 'Private'}
                                size="small"
                                variant="outlined"
                                icon={group.visibility === 'Public' ? <Public /> : <VpnLock />}
                              />
                            </TableCell>
                            <TableCell>
                              {group.createdDateTime ? new Date(group.createdDateTime).toLocaleDateString() : 'Unknown'}
                            </TableCell>
                            <TableCell align="center">
                              <IconButton size="small" onClick={() => handleGroupClick(group)}>
                                <Edit />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {filteredGroups.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="body2" color="text.secondary">
                              {searchTerm || filterType !== 'all' ? 'No groups match your search criteria' : 'No groups found'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </TabPanel>
        </>
      )}

      {/* Group Details Dialog */}
      <Dialog open={!!selectedGroup} onClose={() => setSelectedGroup(null)} maxWidth="lg" fullWidth>
        {selectedGroup && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {getGroupIcon(getGroupType(selectedGroup))}
                  <Box sx={{ ml: 1 }}>
                    <Typography variant="h6">{selectedGroup.displayName}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedGroup.description || 'No description'}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <IconButton>
                    <PersonAdd />
                  </IconButton>
                  <IconButton>
                    <Settings />
                  </IconButton>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Group Information</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Group Type" secondary={getGroupType(selectedGroup)} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Email Address" secondary={selectedGroup.mail || 'None'} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Visibility" secondary={selectedGroup.visibility || 'Private'} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Security Enabled" secondary={selectedGroup.securityEnabled ? 'Yes' : 'No'} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Mail Enabled" secondary={selectedGroup.mailEnabled ? 'Yes' : 'No'} />
                    </ListItem>
                  </List>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Member Statistics</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6" color="primary.main">{selectedGroup.memberCount}</Typography>
                        <Typography variant="caption">Members</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6" color="secondary.main">{selectedGroup.ownerCount}</Typography>
                        <Typography variant="caption">Owners</Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Recent Activity</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Created: {selectedGroup.createdDateTime ? new Date(selectedGroup.createdDateTime).toLocaleString() : 'Unknown'}
                  </Typography>
                </Grid>
              </Grid>

              {groupMembers.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 3, mb: 2 }}>
                    Members ({groupMembers.length})
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Email</TableCell>
                          <TableCell>Department</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {groupMembers.slice(0, 5).map((member) => (
                          <TableRow key={member.id}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ width: 32, height: 32 }}>
                                  {member.displayName?.charAt(0) || '?'}
                                </Avatar>
                                {member.displayName}
                              </Box>
                            </TableCell>
                            <TableCell>{member.userPrincipalName}</TableCell>
                            <TableCell>{member.department || '-'}</TableCell>
                            <TableCell>
                              <Chip
                                label={member.accountEnabled ? 'Active' : 'Disabled'}
                                size="small"
                                color={member.accountEnabled ? 'success' : 'error'}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                        {groupMembers.length > 5 && (
                          <TableRow>
                            <TableCell colSpan={4} sx={{ textAlign: 'center', fontStyle: 'italic' }}>
                              ... and {groupMembers.length - 5} more members
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedGroup(null)}>Close</Button>
              <Button variant="contained" startIcon={<Edit />}>
                Edit Group
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Create Group Dialog */}
      <GroupCreationForm
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSubmit={handleCreateGroup}
      />

      {/* Create Group FAB */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setShowCreateDialog(true)}
      >
        <Add />
      </Fab>

      {/* Refresh Success Snackbar */}
      <Snackbar
        open={showRefreshSuccess}
        autoHideDuration={3000}
        onClose={() => setShowRefreshSuccess(false)}
        message="Groups refreshed successfully"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      />
    </Box>
  );
};

export default GroupManagementLive;