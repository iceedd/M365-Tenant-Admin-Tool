import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, IconButton, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle,
  DialogContent, DialogActions, List, ListItem, ListItemText, Chip, TextField,
  FormControl, InputLabel, Select, MenuItem, Tabs, Tab, Alert, CircularProgress,
  Snackbar, Fab, Menu, MenuList, MenuItem as MenuItemComponent, Avatar, Autocomplete
} from '@mui/material';
import {
  Group, Security, Email, People, PersonAdd, Add, Edit, Delete, MoreVert,
  Refresh, FilterList, Search, Settings, CheckCircle, AdminPanelSettings,
  Shield, Business, Public, VpnLock, MailOutline, GroupWork, GetApp
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

interface UserOption {
  id: string;
  displayName: string;
  userPrincipalName: string;
  department?: string;
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
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [showEditGroupDialog, setShowEditGroupDialog] = useState(false);
  const [showGroupSettingsDialog, setShowGroupSettingsDialog] = useState(false);
  const [editGroupFormData, setEditGroupFormData] = useState<{displayName: string; description: string; visibility: string}>({displayName: '', description: '', visibility: 'Private'});
  const [availableUsers, setAvailableUsers] = useState<UserOption[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [selectedUsersForAdding, setSelectedUsersForAdding] = useState<UserOption[]>([]);

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
            
            if (dataService.isUsingRealApi() && group.id) {
              // Get real member counts from API
              try {
                const [members, owners] = await Promise.all([
                  dataService.getGroupMembers(group.id),
                  dataService.getGroupOwners(group.id)
                ]);
                memberCount = members.length;
                ownerCount = owners.length;
                console.log(`📊 Group ${group.displayName}: ${memberCount} members, ${ownerCount} owners`);
              } catch (err) {
                console.warn(`Failed to get member count for group ${group.displayName}:`, err);
                memberCount = 0;
                ownerCount = 0;
              }
            } else {
              // For mock data or missing group ID, set to 0
              memberCount = 0;
              ownerCount = 0;
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
      console.log(`🔄 Loading details for group: ${group.displayName} (ID: ${group.id})`);
      
      // Load group members and owners
      const [members, owners] = await Promise.all([
        dataService.getGroupMembers(group.id),
        dataService.getGroupOwners(group.id)
      ]);
      
      console.log(`✅ Loaded group details: ${members.length} members, ${owners.length} owners`);
      
      setGroupMembers(members);
      setGroupOwners(owners);
    } catch (err) {
      console.error('❌ Failed to load group details:', err);
      // Set empty arrays on error to avoid showing stale data
      setGroupMembers([]);
      setGroupOwners([]);
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

  const handleExportGroups = () => {
    try {
      // Prepare data for export
      const exportData = filteredGroups.map(group => ({
        'Group Name': group.displayName || 'N/A',
        'Description': group.description || '',
        'Group Type': group.securityEnabled && group.mailEnabled ? 'Mail-Enabled Security' :
                     group.securityEnabled ? 'Security' :
                     group.mailEnabled ? 'Distribution' : 'Microsoft 365',
        'Visibility': group.visibility || 'Private',
        'Email': group.mail || '',
        'Member Count': group.memberCount,
        'Owner Count': group.ownerCount,
        'Created Date': group.createdDateTime ? new Date(group.createdDateTime).toLocaleDateString() : '',
        'ID': group.id || ''
      }));

      // Convert to CSV
      if (exportData.length === 0) {
        alert('No groups to export');
        return;
      }

      const headers = Object.keys(exportData[0]);
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row] || '';
            // Escape commas and quotes in CSV
            return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
              ? `"${value.replace(/"/g, '""')}"` 
              : value;
          }).join(',')
        )
      ].join('\n');

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `groups_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log(`Exported ${exportData.length} groups to CSV`);
    } catch (error) {
      console.error('Failed to export groups:', error);
      alert('Failed to export groups. Please try again.');
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

  const loadAvailableUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const users = await dataService.getUsers(['id', 'displayName', 'userPrincipalName', 'department']);
      const userOptions: UserOption[] = users.map(user => ({
        id: user.id || '',
        displayName: user.displayName || '',
        userPrincipalName: user.userPrincipalName || '',
        department: user.department || undefined
      }));
      setAvailableUsers(userOptions);
    } catch (error) {
      console.error('Failed to load users for member selection:', error);
      setAvailableUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleAddMember = async () => {
    if (selectedGroup) {
      setSelectedUsersForAdding([]);  // Clear any previous selections
      await loadAvailableUsers();
      setShowAddMemberDialog(true);
    }
  };

  const handleEditGroup = () => {
    if (selectedGroup) {
      // Pre-populate the form with current group data
      setEditGroupFormData({
        displayName: selectedGroup.displayName || '',
        description: selectedGroup.description || '',
        visibility: selectedGroup.visibility || 'Private'
      });
      setShowEditGroupDialog(true);
    }
  };

  const handleAddMemberSubmit = async (selectedUsers: UserOption[]) => {
    if (!selectedGroup || !selectedUsers.length) return;
    
    try {
      console.log(`Adding ${selectedUsers.length} members to group ${selectedGroup.displayName}:`, selectedUsers);
      
      // Add each selected user to the group using real Graph API
      for (const user of selectedUsers) {
        await dataService.addGroupMember(selectedGroup.id!, user.id);
      }
      
      alert(`Successfully added ${selectedUsers.length} members to ${selectedGroup.displayName}`);
      setShowAddMemberDialog(false);
      setSelectedUsersForAdding([]);  // Clear selections after successful addition
      
      // Refresh group details to show new members
      await loadGroupDetails(selectedGroup);
      
      // Refresh groups list to update member counts
      await loadGroups();
    } catch (error) {
      console.error('Failed to add members:', error);
      alert(`Failed to add members: ${error}`);
    }
  };

  const handleEditGroupSubmit = async (groupData: any) => {
    if (!selectedGroup) return;
    
    try {
      console.log(`Updating group ${selectedGroup.displayName}:`, groupData);
      
      // Update group using real Graph API
      await dataService.updateGroup(selectedGroup.id!, groupData);
      
      alert(`Successfully updated group: ${groupData.displayName}`);
      setShowEditGroupDialog(false);
      
      // Refresh group details to show updated info
      await loadGroupDetails(selectedGroup);
      
      // Refresh groups list
      await loadGroups();
    } catch (error) {
      console.error('Failed to update group:', error);
      alert(`Failed to update group: ${error}`);
    }
  };

  const handleGroupSettings = () => {
    if (selectedGroup) {
      setShowGroupSettingsDialog(true);
    }
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
          <Button 
            variant="outlined" 
            startIcon={<GetApp />}
            onClick={handleExportGroups}
            disabled={isLoading || filteredGroups.length === 0}
          >
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
                  <IconButton onClick={handleAddMember} title="Add Member">
                    <PersonAdd />
                  </IconButton>
                  <IconButton onClick={handleGroupSettings} title="Group Settings">
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

              <Typography variant="subtitle2" sx={{ mt: 3, mb: 2 }}>
                Members ({groupMembers.length})
              </Typography>
              
              {groupMembers.length > 0 ? (
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
              ) : (
                <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    This group has no members yet. Use the "Add Member" button to add users to this group.
                  </Typography>
                </Paper>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedGroup(null)}>Close</Button>
              <Button variant="contained" startIcon={<Edit />} onClick={handleEditGroup}>
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

      {/* Add Member Dialog */}
      <Dialog open={showAddMemberDialog} onClose={() => setShowAddMemberDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Members to {selectedGroup?.displayName}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select users to add as members to this group. You can search for users by name or email.
          </Typography>
          
          <Autocomplete
            multiple
            options={availableUsers}
            loading={isLoadingUsers}
            getOptionLabel={(option) => `${option.displayName} (${option.userPrincipalName})`}
            value={selectedUsersForAdding}
            onChange={(_, value) => setSelectedUsersForAdding(value)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Users to Add"
                placeholder="Search for users..."
                helperText="Start typing to search for users in your organization"
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option.id}
                  label={option.displayName}
                  color="primary"
                />
              ))
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowAddMemberDialog(false);
            setSelectedUsersForAdding([]);
          }}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            handleAddMemberSubmit(selectedUsersForAdding);
          }} disabled={selectedUsersForAdding.length === 0}>
            Add Members
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={showEditGroupDialog} onClose={() => setShowEditGroupDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Group: {selectedGroup?.displayName}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Group Name"
              value={editGroupFormData.displayName}
              onChange={(e) => setEditGroupFormData(prev => ({...prev, displayName: e.target.value}))}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={editGroupFormData.description}
              onChange={(e) => setEditGroupFormData(prev => ({...prev, description: e.target.value}))}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Visibility</InputLabel>
              <Select
                value={editGroupFormData.visibility}
                onChange={(e) => setEditGroupFormData(prev => ({...prev, visibility: e.target.value}))}
                label="Visibility"
              >
                <MenuItem value="Public">Public</MenuItem>
                <MenuItem value="Private">Private</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditGroupDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            handleEditGroupSubmit(editGroupFormData);
          }} disabled={!editGroupFormData.displayName.trim()}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Group Settings Dialog */}
      <Dialog open={showGroupSettingsDialog} onClose={() => setShowGroupSettingsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Settings />
            Settings: {selectedGroup?.displayName}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Group Management Settings</Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Security /> Security & Permissions
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Configure group access policies and security settings.
                </Typography>
                <Button variant="outlined" size="small" disabled>
                  Configure Security
                </Button>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Email /> Mail Settings
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Manage email distribution and notification preferences.
                </Typography>
                <Button variant="outlined" size="small" disabled>
                  Configure Mail
                </Button>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <People /> Membership Policies
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Control who can join the group and member approval settings.
                </Typography>
                <Button variant="outlined" size="small" disabled>
                  Manage Membership
                </Button>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Shield /> Access Policies
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Define conditional access and compliance policies.
                </Typography>
                <Button variant="outlined" size="small" disabled>
                  Configure Access
                </Button>
              </Card>
            </Grid>
          </Grid>
          
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              These advanced settings require additional implementation and may need specific Graph API permissions. 
              Contact your administrator for more information.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowGroupSettingsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

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