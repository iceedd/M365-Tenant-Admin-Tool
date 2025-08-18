import React, { useState } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Alert,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  Tooltip,
  Menu,
  MenuList,
  MenuItem as MenuItemComponent,
  Fab,
  Snackbar,
  CircularProgress
} from '@mui/material';
import {
  Group,
  Security,
  Email,
  People,
  PersonAdd,
  PersonRemove,
  Add,
  Edit,
  Delete,
  MoreVert,
  ExpandMore,
  Refresh,
  FilterList,
  Search,
  Download,
  Upload,
  Settings,
  CheckCircle,
  Warning,
  Info,
  Business,
  Public,
  VpnLock,
  MailOutline,
  GroupWork,
  AdminPanelSettings,
  Shield
} from '@mui/icons-material';
import GroupCreationForm from './GroupCreationForm';

// Types based on PowerShell group discovery patterns
interface GroupMember {
  id: string;
  displayName: string;
  userPrincipalName: string;
  userType: 'Member' | 'Guest';
  department?: string;
  jobTitle?: string;
  accountEnabled: boolean;
  joinedDate: string;
}

interface GroupData {
  id: string;
  displayName: string;
  description: string;
  groupType: 'Security' | 'Distribution' | 'Microsoft365' | 'Mail-Enabled Security';
  email?: string;
  memberCount: number;
  ownerCount: number;
  visibility: 'Public' | 'Private';
  joinPolicy: 'Open' | 'Closed' | 'Owner Approval';
  createdDateTime: string;
  lastModifiedDateTime: string;
  members: GroupMember[];
  owners: GroupMember[];
  securityEnabled: boolean;
  mailEnabled: boolean;
  groupTypes: string[];
  classification?: string;
  sensitivityLabel?: string;
}

// Mock data based on PowerShell Get-MgGroup results
const mockGroups: GroupData[] = [
  {
    id: '1',
    displayName: 'IT Department',
    description: 'Information Technology team security group',
    groupType: 'Security',
    memberCount: 15,
    ownerCount: 2,
    visibility: 'Private',
    joinPolicy: 'Closed',
    createdDateTime: '2023-01-15T10:30:00Z',
    lastModifiedDateTime: '2025-08-10T14:22:00Z',
    securityEnabled: true,
    mailEnabled: false,
    groupTypes: [],
    classification: 'Confidential',
    members: [
      { id: '1', displayName: 'John Smith', userPrincipalName: 'john.smith@contoso.com', userType: 'Member', department: 'IT', jobTitle: 'Senior Developer', accountEnabled: true, joinedDate: '2023-01-15' },
      { id: '2', displayName: 'Sarah Wilson', userPrincipalName: 'sarah.wilson@contoso.com', userType: 'Member', department: 'IT', jobTitle: 'IT Manager', accountEnabled: true, joinedDate: '2023-01-20' }
    ],
    owners: [
      { id: '2', displayName: 'Sarah Wilson', userPrincipalName: 'sarah.wilson@contoso.com', userType: 'Member', department: 'IT', jobTitle: 'IT Manager', accountEnabled: true, joinedDate: '2023-01-15' }
    ]
  },
  {
    id: '2',
    displayName: 'All Employees',
    description: 'Company-wide distribution list for announcements',
    groupType: 'Distribution',
    email: 'alemployees@contoso.com',
    memberCount: 325,
    ownerCount: 3,
    visibility: 'Public',
    joinPolicy: 'Owner Approval',
    createdDateTime: '2022-12-01T09:00:00Z',
    lastModifiedDateTime: '2025-08-15T11:45:00Z',
    securityEnabled: false,
    mailEnabled: true,
    groupTypes: [],
    members: [
      { id: '1', displayName: 'John Smith', userPrincipalName: 'john.smith@contoso.com', userType: 'Member', department: 'IT', accountEnabled: true, joinedDate: '2022-12-01' },
      { id: '3', displayName: 'Mike Johnson', userPrincipalName: 'mike.johnson@contoso.com', userType: 'Member', department: 'Sales', accountEnabled: true, joinedDate: '2023-02-15' }
    ],
    owners: [
      { id: '4', displayName: 'HR Admin', userPrincipalName: 'hradmin@contoso.com', userType: 'Member', department: 'HR', accountEnabled: true, joinedDate: '2022-12-01' }
    ]
  },
  {
    id: '3',
    displayName: 'Project Alpha Team',
    description: 'Microsoft 365 group for Project Alpha collaboration',
    groupType: 'Microsoft365',
    email: 'projectalpha@contoso.com',
    memberCount: 8,
    ownerCount: 1,
    visibility: 'Private',
    joinPolicy: 'Closed',
    createdDateTime: '2025-02-10T13:15:00Z',
    lastModifiedDateTime: '2025-08-16T16:30:00Z',
    securityEnabled: false,
    mailEnabled: true,
    groupTypes: ['Unified'],
    classification: 'Internal',
    sensitivityLabel: 'Confidential',
    members: [
      { id: '1', displayName: 'John Smith', userPrincipalName: 'john.smith@contoso.com', userType: 'Member', department: 'IT', accountEnabled: true, joinedDate: '2025-02-10' },
      { id: '5', displayName: 'Lisa Chen', userPrincipalName: 'lisa.chen@contoso.com', userType: 'Member', department: 'Product', accountEnabled: true, joinedDate: '2025-02-12' }
    ],
    owners: [
      { id: '6', displayName: 'Project Manager', userPrincipalName: 'pm@contoso.com', userType: 'Member', department: 'PMO', accountEnabled: true, joinedDate: '2025-02-10' }
    ]
  },
  {
    id: '4',
    displayName: 'IT Support',
    description: 'IT Support mail-enabled security group for helpdesk',
    groupType: 'Mail-Enabled Security',
    email: 'itsupport@contoso.com',
    memberCount: 5,
    ownerCount: 1,
    visibility: 'Private',
    joinPolicy: 'Closed',
    createdDateTime: '2023-03-20T08:45:00Z',
    lastModifiedDateTime: '2025-07-22T12:00:00Z',
    securityEnabled: true,
    mailEnabled: true,
    groupTypes: [],
    classification: 'Internal',
    members: [
      { id: '7', displayName: 'Support Agent 1', userPrincipalName: 'support1@contoso.com', userType: 'Member', department: 'IT', accountEnabled: true, joinedDate: '2023-03-20' },
      { id: '8', displayName: 'Support Agent 2', userPrincipalName: 'support2@contoso.com', userType: 'Member', department: 'IT', accountEnabled: true, joinedDate: '2023-04-01' }
    ],
    owners: [
      { id: '2', displayName: 'Sarah Wilson', userPrincipalName: 'sarah.wilson@contoso.com', userType: 'Member', department: 'IT', accountEnabled: true, joinedDate: '2023-03-20' }
    ]
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

const GroupManagement: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState<GroupData | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showMemberDialog, setShowMemberDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRefreshSuccess, setShowRefreshSuccess] = useState(false);

  const handleCreateGroup = (groupData: any) => {
    console.log('Creating group:', groupData);
    // In a real implementation, this would call the Microsoft Graph API
    // For now, we'll just close the dialog and show success
    setShowCreateDialog(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Simulate API call to refresh group data
      console.log('Refreshing groups data...');
      
      // In a real implementation, this would:
      // 1. Call Microsoft Graph API: GET /groups
      // 2. Update the groups state with fresh data
      // 3. Refresh group counts and statistics
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Groups data refreshed successfully');
      setShowRefreshSuccess(true);
    } catch (error) {
      console.error('Failed to refresh groups:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getGroupIcon = (groupType: string) => {
    switch (groupType) {
      case 'Security':
        return <Security color="error" />;
      case 'Distribution':
        return <MailOutline color="primary" />;
      case 'Microsoft365':
        return <GroupWork color="secondary" />;
      case 'Mail-Enabled Security':
        return <Shield color="warning" />;
      default:
        return <Group />;
    }
  };

  const getGroupTypeColor = (groupType: string) => {
    switch (groupType) {
      case 'Security':
        return 'error';
      case 'Distribution':
        return 'primary';
      case 'Microsoft365':
        return 'secondary';
      case 'Mail-Enabled Security':
        return 'warning';
      default:
        return 'default';
    }
  };

  const filteredGroups = mockGroups.filter(group => {
    const matchesSearch = group.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || group.groupType === filterType;
    return matchesSearch && matchesFilter;
  });

  const groupTypeStats = {
    total: mockGroups.length,
    security: mockGroups.filter(g => g.groupType === 'Security').length,
    distribution: mockGroups.filter(g => g.groupType === 'Distribution').length,
    microsoft365: mockGroups.filter(g => g.groupType === 'Microsoft365').length,
    mailEnabledSecurity: mockGroups.filter(g => g.groupType === 'Mail-Enabled Security').length
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

  const GroupCard = ({ group }: { group: GroupData }) => (
    <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={() => setSelectedGroup(group)}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              {getGroupIcon(group.groupType)}
              <Typography variant="h6" component="div" sx={{ fontWeight: 600, ml: 1 }}>
                {group.displayName}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {group.description}
            </Typography>
            {group.email && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                <Email fontSize="small" sx={{ mr: 0.5 }} />
                {group.email}
              </Typography>
            )}
          </Box>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); setAnchorEl(e.currentTarget); }}>
            <MoreVert />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip
            label={group.groupType}
            size="small"
            color={getGroupTypeColor(group.groupType) as any}
          />
          <Chip
            label={group.visibility}
            size="small"
            variant="outlined"
            icon={group.visibility === 'Public' ? <Public /> : <VpnLock />}
          />
          {group.classification && (
            <Chip label={group.classification} size="small" variant="outlined" />
          )}
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
            Created {new Date(group.createdDateTime).toLocaleDateString()}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Group Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
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

      {/* Group Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            icon={<Group />}
            title="Total Groups"
            value={groupTypeStats.total}
            subtitle="All group types"
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            icon={<Security />}
            title="Security Groups"
            value={groupTypeStats.security}
            subtitle="Access control"
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            icon={<MailOutline />}
            title="Distribution Lists"
            value={groupTypeStats.distribution}
            subtitle="Email distribution"
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            icon={<GroupWork />}
            title="M365 Groups"
            value={groupTypeStats.microsoft365}
            subtitle="Collaboration"
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            icon={<Shield />}
            title="Mail-Enabled Security"
            value={groupTypeStats.mailEnabledSecurity}
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
                placeholder="Search groups..."
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

      <TabPanel value={currentTab} index={0}>
        <Grid container spacing={3}>
          {filteredGroups.map((group) => (
            <Grid item xs={12} sm={6} lg={4} xl={3} key={group.id}>
              <GroupCard group={group} />
            </Grid>
          ))}
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
                  {filteredGroups.map((group) => (
                    <TableRow key={group.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getGroupIcon(group.groupType)}
                          <Box sx={{ ml: 1 }}>
                            <Typography variant="body2" fontWeight="medium">
                              {group.displayName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {group.description}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={group.groupType}
                          size="small"
                          color={getGroupTypeColor(group.groupType) as any}
                        />
                      </TableCell>
                      <TableCell>
                        {group.email ? (
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {group.email}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">{group.memberCount}</TableCell>
                      <TableCell align="center">{group.ownerCount}</TableCell>
                      <TableCell>
                        <Chip
                          label={group.visibility}
                          size="small"
                          variant="outlined"
                          icon={group.visibility === 'Public' ? <Public /> : <VpnLock />}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(group.createdDateTime).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => setSelectedGroup(group)}>
                          <Edit />
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

      {/* Group Details Dialog */}
      <Dialog open={!!selectedGroup} onClose={() => setSelectedGroup(null)} maxWidth="lg" fullWidth>
        {selectedGroup && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {getGroupIcon(selectedGroup.groupType)}
                  <Box sx={{ ml: 1 }}>
                    <Typography variant="h6">{selectedGroup.displayName}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedGroup.description}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <IconButton onClick={() => setShowMemberDialog(true)}>
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
                      <ListItemText primary="Group Type" secondary={selectedGroup.groupType} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Email Address" secondary={selectedGroup.email || 'None'} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Visibility" secondary={selectedGroup.visibility} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Join Policy" secondary={selectedGroup.joinPolicy} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Classification" secondary={selectedGroup.classification || 'None'} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Sensitivity Label" secondary={selectedGroup.sensitivityLabel || 'None'} />
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
                    Created: {new Date(selectedGroup.createdDateTime).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Last Modified: {new Date(selectedGroup.lastModifiedDateTime).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>

              <Typography variant="subtitle2" sx={{ mt: 3, mb: 2 }}>
                Members ({selectedGroup.members.length})
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Department</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedGroup.members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>{member.displayName}</TableCell>
                        <TableCell>{member.userPrincipalName}</TableCell>
                        <TableCell>{member.department || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={selectedGroup.owners.find(o => o.id === member.id) ? 'Owner' : 'Member'}
                            size="small"
                            color={selectedGroup.owners.find(o => o.id === member.id) ? 'primary' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={member.accountEnabled ? 'Active' : 'Disabled'}
                            size="small"
                            color={member.accountEnabled ? 'success' : 'error'}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton size="small">
                            <PersonRemove />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
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

      {/* Create Group FAB */}
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

export default GroupManagement;