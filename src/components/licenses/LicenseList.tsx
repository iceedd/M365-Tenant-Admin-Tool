import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  License as LicenseIcon,
  Person as PersonIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useGetLicensesQuery, useGetUsersWithLicenseQuery } from '../../store/api/licensesApi';
import { License } from '../../types';

interface LicenseListProps {
  onAssignLicense?: (license: License) => void;
  onManageLicense?: (license: License) => void;
}

const LicenseList: React.FC<LicenseListProps> = ({
  onAssignLicense,
  onManageLicense,
}) => {
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [usersDialogOpen, setUsersDialogOpen] = useState(false);

  const { data: licenses = [], isLoading, error } = useGetLicensesQuery();
  const { data: licenseUsers = [] } = useGetUsersWithLicenseQuery(selectedLicense?.skuId!, {
    skip: !selectedLicense,
  });

  const handleViewUsers = (license: License) => {
    setSelectedLicense(license);
    setUsersDialogOpen(true);
  };

  const handleCloseUsersDialog = () => {
    setUsersDialogOpen(false);
    setSelectedLicense(null);
  };

  const getLicenseStatus = (license: License) => {
    const available = license.prepaidUnits.enabled - license.consumedUnits;
    const usagePercentage = (license.consumedUnits / license.prepaidUnits.enabled) * 100;

    if (available === 0) {
      return { status: 'full', color: 'error', label: 'Full' };
    } else if (usagePercentage >= 90) {
      return { status: 'warning', color: 'warning', label: 'Low' };
    } else {
      return { status: 'available', color: 'success', label: 'Available' };
    }
  };

  if (error) {
    return (
      <Alert severity="error">
        Failed to load licenses. Please try again.
      </Alert>
    );
  }

  if (isLoading) {
    return <Box>Loading licenses...</Box>;
  }

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 3 
      }}>
        <Typography variant="h4" component="h1">
          License Management
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {licenses.map((license) => {
          const status = getLicenseStatus(license);
          const available = license.prepaidUnits.enabled - license.consumedUnits;
          const usagePercentage = (license.consumedUnits / license.prepaidUnits.enabled) * 100;

          return (
            <Grid item xs={12} md={6} lg={4} key={license.skuId}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', marginBottom: 2 }}>
                    <Avatar sx={{ marginRight: 2, backgroundColor: 'primary.main' }}>
                      <LicenseIcon />
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="h2" gutterBottom>
                        {license.skuPartNumber}
                      </Typography>
                      <Chip
                        icon={
                          status.status === 'full' ? <WarningIcon /> :
                          status.status === 'warning' ? <WarningIcon /> :
                          <CheckIcon />
                        }
                        label={status.label}
                        color={status.color as 'error' | 'warning' | 'success'}
                        size="small"
                      />
                    </Box>
                  </Box>

                  <Box sx={{ marginBottom: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Usage
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {license.consumedUnits} / {license.prepaidUnits.enabled}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(usagePercentage, 100)}
                      color={status.color as 'primary' | 'secondary'}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Grid container spacing={2} sx={{ marginBottom: 2 }}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Available
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        {available}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        In Use
                      </Typography>
                      <Typography variant="h6" color="primary.main">
                        {license.consumedUnits}
                      </Typography>
                    </Grid>
                  </Grid>

                  {license.prepaidUnits.suspended > 0 && (
                    <Alert severity="warning" sx={{ marginBottom: 2 }}>
                      {license.prepaidUnits.suspended} licenses suspended
                    </Alert>
                  )}

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleViewUsers(license)}
                      startIcon={<PersonIcon />}
                    >
                      View Users ({license.consumedUnits})
                    </Button>
                    
                    {onAssignLicense && available > 0 && (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => onAssignLicense(license)}
                      >
                        Assign
                      </Button>
                    )}
                    
                    {onManageLicense && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => onManageLicense(license)}
                      >
                        Manage
                      </Button>
                    )}
                  </Box>

                  {license.servicePlans.length > 0 && (
                    <Box sx={{ marginTop: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Included Services ({license.servicePlans.length})
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {license.servicePlans.slice(0, 3).map((plan) => (
                          <Tooltip key={plan.servicePlanId} title={plan.servicePlanName}>
                            <Chip
                              label={plan.servicePlanName.split('_')[0]}
                              size="small"
                              variant="outlined"
                            />
                          </Tooltip>
                        ))}
                        {license.servicePlans.length > 3 && (
                          <Chip
                            label={`+${license.servicePlans.length - 3} more`}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        )}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {licenses.length === 0 && (
        <Box sx={{ textAlign: 'center', padding: 4 }}>
          <InfoIcon sx={{ fontSize: 64, color: 'text.secondary', marginBottom: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Licenses Found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No licenses are currently available in your Microsoft 365 tenant.
          </Typography>
        </Box>
      )}

      {/* Users Dialog */}
      <Dialog
        open={usersDialogOpen}
        onClose={handleCloseUsersDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Users with {selectedLicense?.skuPartNumber}
        </DialogTitle>
        <DialogContent>
          {licenseUsers.length === 0 ? (
            <Alert severity="info">
              No users currently have this license assigned.
            </Alert>
          ) : (
            <List>
              {licenseUsers.map((user) => (
                <ListItem key={user.id}>
                  <ListItemAvatar>
                    <Avatar>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={user.displayName}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {user.userPrincipalName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Assigned: {new Date(user.assignedDate).toLocaleDateString()}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default LicenseList;