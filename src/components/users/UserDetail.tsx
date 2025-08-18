import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tabs,
  Tab,
  Avatar,
  Divider,
  Alert,
} from '@mui/material';
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Location as LocationIcon,
  AdminPanelSettings as AdminIcon,
  Group as GroupIcon,
  License as LicenseIcon,
} from '@mui/icons-material';
import { User } from '../../types';
import { 
  useGetUserQuery,
  useAssignLicenseMutation,
  useRemoveLicenseMutation,
  useAddToGroupMutation,
  useRemoveFromGroupMutation,
} from '../../store/api/usersApi';
import { useGetLicensesQuery } from '../../store/api/licensesApi';
import { useGetGroupsQuery } from '../../store/api/groupsApi';
import { useDispatch } from 'react-redux';
import { addNotification } from '../../store/slices/notificationSlice';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`user-detail-tabpanel-${index}`}
      aria-labelledby={`user-detail-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface UserDetailProps {
  open: boolean;
  onClose: () => void;
  userId: string | null;
  onEdit: (user: User) => void;
}

const UserDetail: React.FC<UserDetailProps> = ({
  open,
  onClose,
  userId,
  onEdit,
}) => {
  const dispatch = useDispatch();
  const [tabValue, setTabValue] = useState(0);
  
  const { data: user, isLoading, error } = useGetUserQuery(userId!, {
    skip: !userId,
  });
  
  const { data: licenses = [] } = useGetLicensesQuery();
  const { data: groupsData } = useGetGroupsQuery({ 
    pagination: { page: 1, pageSize: 100 } 
  });
  
  const [assignLicense] = useAssignLicenseMutation();
  const [removeLicense] = useRemoveLicenseMutation();
  const [addToGroup] = useAddToGroupMutation();
  const [removeFromGroup] = useRemoveFromGroupMutation();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAssignLicense = async (licenseId: string) => {
    if (!user) return;
    
    try {
      await assignLicense({ userId: user.id, licenseId }).unwrap();
      dispatch(addNotification({
        type: 'success',
        title: 'License Assigned',
        message: 'License has been assigned successfully.',
      }));
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        title: 'Assignment Failed',
        message: error?.data?.message || 'Failed to assign license.',
      }));
    }
  };

  const handleRemoveLicense = async (licenseId: string) => {
    if (!user) return;
    
    try {
      await removeLicense({ userId: user.id, licenseId }).unwrap();
      dispatch(addNotification({
        type: 'success',
        title: 'License Removed',
        message: 'License has been removed successfully.',
      }));
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        title: 'Removal Failed',
        message: error?.data?.message || 'Failed to remove license.',
      }));
    }
  };

  const handleAddToGroup = async (groupId: string) => {
    if (!user) return;
    
    try {
      await addToGroup({ userId: user.id, groupId }).unwrap();
      dispatch(addNotification({
        type: 'success',
        title: 'Added to Group',
        message: 'User has been added to the group successfully.',
      }));
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        title: 'Add Failed',
        message: error?.data?.message || 'Failed to add user to group.',
      }));
    }
  };

  const handleRemoveFromGroup = async (groupId: string) => {
    if (!user) return;
    
    try {
      await removeFromGroup({ userId: user.id, groupId }).unwrap();
      dispatch(addNotification({
        type: 'success',
        title: 'Removed from Group',
        message: 'User has been removed from the group successfully.',
      }));
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        title: 'Removal Failed',
        message: error?.data?.message || 'Failed to remove user from group.',
      }));
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>Loading user details...</DialogContent>
      </Dialog>
    );
  }

  if (error || !user) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Alert severity="error">Failed to load user details.</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  const assignedLicenseIds = user.assignedLicenses.map(al => al.skuId);
  const availableLicenses = licenses.filter(l => !assignedLicenseIds.includes(l.skuId));
  
  const userGroups = groupsData?.groups?.filter(g => user.groups.includes(g.id)) || [];
  const availableGroups = groupsData?.groups?.filter(g => !user.groups.includes(g.id)) || [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 56, height: 56 }}>
            <PersonIcon />
          </Avatar>
          <Box>
            <Typography variant="h5">{user.displayName}</Typography>
            <Typography variant="body2" color="text.secondary">
              {user.userPrincipalName}
            </Typography>
          </Box>
          <Box sx={{ marginLeft: 'auto' }}>
            <Chip
              icon={user.accountEnabled ? <AdminIcon /> : undefined}
              label={user.accountEnabled ? 'Active' : 'Inactive'}
              color={user.accountEnabled ? 'success' : 'error'}
            />
          </Box>
        </Box>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Overview" />
          <Tab label="Licenses" />
          <Tab label="Groups" />
          <Tab label="Activity" />
        </Tabs>
      </Box>

      <DialogContent sx={{ height: 500, overflow: 'auto' }}>
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Personal Information
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon color="action" />
                      <Typography>
                        {user.givenName} {user.surname}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmailIcon color="action" />
                      <Typography>{user.mail || user.userPrincipalName}</Typography>
                    </Box>
                    {user.mobilePhone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon color="action" />
                        <Typography>{user.mobilePhone}</Typography>
                      </Box>
                    )}
                    {user.businessPhones.length > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon color="action" />
                        <Typography>{user.businessPhones.join(', ')}</Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Work Information
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {user.jobTitle && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BusinessIcon color="action" />
                        <Typography>{user.jobTitle}</Typography>
                      </Box>
                    )}
                    {user.department && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BusinessIcon color="action" />
                        <Typography>{user.department}</Typography>
                      </Box>
                    )}
                    {user.officeLocation && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationIcon color="action" />
                        <Typography>{user.officeLocation}</Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationIcon color="action" />
                      <Typography>Usage Location: {user.usageLocation}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Account Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Created Date
                      </Typography>
                      <Typography>
                        {new Date(user.createdDateTime).toLocaleDateString()}
                      </Typography>
                    </Grid>
                    {user.lastSignInDateTime && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Last Sign In
                        </Typography>
                        <Typography>
                          {new Date(user.lastSignInDateTime).toLocaleDateString()}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Assigned Licenses
          </Typography>
          {user.assignedLicenses.length === 0 ? (
            <Alert severity="info">No licenses assigned to this user.</Alert>
          ) : (
            <List>
              {user.assignedLicenses.map((assignedLicense) => {
                const license = licenses.find(l => l.skuId === assignedLicense.skuId);
                return (
                  <ListItem key={assignedLicense.skuId}>
                    <ListItemText
                      primary={license?.skuPartNumber || assignedLicense.skuId}
                      secondary={`SKU ID: ${assignedLicense.skuId}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleRemoveLicense(assignedLicense.skuId)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                );
              })}
            </List>
          )}

          <Divider sx={{ marginY: 2 }} />

          <Typography variant="h6" gutterBottom>
            Available Licenses
          </Typography>
          {availableLicenses.length === 0 ? (
            <Alert severity="info">No additional licenses available.</Alert>
          ) : (
            <List>
              {availableLicenses.map((license) => (
                <ListItem key={license.skuId}>
                  <ListItemText
                    primary={license.skuPartNumber}
                    secondary={`Available: ${license.prepaidUnits.enabled - license.consumedUnits}`}
                  />
                  <ListItemSecondaryAction>
                    <Button
                      size="small"
                      onClick={() => handleAssignLicense(license.skuId)}
                      disabled={license.prepaidUnits.enabled <= license.consumedUnits}
                    >
                      Assign
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Group Memberships
          </Typography>
          {userGroups.length === 0 ? (
            <Alert severity="info">User is not a member of any groups.</Alert>
          ) : (
            <List>
              {userGroups.map((group) => (
                <ListItem key={group.id}>
                  <ListItemText
                    primary={group.displayName}
                    secondary={group.description}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleRemoveFromGroup(group.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}

          <Divider sx={{ marginY: 2 }} />

          <Typography variant="h6" gutterBottom>
            Available Groups
          </Typography>
          {availableGroups.length === 0 ? (
            <Alert severity="info">No additional groups available.</Alert>
          ) : (
            <List>
              {availableGroups.map((group) => (
                <ListItem key={group.id}>
                  <ListItemText
                    primary={group.displayName}
                    secondary={group.description}
                  />
                  <ListItemSecondaryAction>
                    <Button
                      size="small"
                      onClick={() => handleAddToGroup(group.id)}
                    >
                      Add
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Recent Activity
          </Typography>
          <Alert severity="info">
            Activity tracking will be available in a future update.
          </Alert>
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => onEdit(user)}
        >
          Edit User
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserDetail;