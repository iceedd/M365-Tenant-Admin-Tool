import React, { useState, useEffect } from 'react';
import { useGetLicensesQuery, useGetLicenseUsageQuery, useGetLicenseQuery, useGetUsersWithLicenseQuery } from '../../store/api/licensesApi';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
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
  Divider,
  Alert,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Assignment,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Error,
  Info,
  ExpandMore,
  Refresh,
  PersonAdd,
  PersonRemove,
  Search,
  FilterList,
  GetApp,
  Settings
} from '@mui/icons-material';

// Types based on PowerShell license discovery
interface ServicePlan {
  servicePlanId: string;
  servicePlanName: string;
  appliesTo: string;
  provisioningStatus: 'Success' | 'Disabled' | 'PendingInput' | 'PendingActivation';
}

interface License {
  skuId: string;
  skuPartNumber: string;
  displayName: string;
  total: number;
  consumed: number;
  available: number;
  percentage: number;
  warning: number;
  suspended: number;
  servicePlans: ServicePlan[];
  costPerMonth?: number;
  renewalDate?: string;
}

interface UserLicense {
  userId: string;
  displayName: string;
  userPrincipalName: string;
  assignedLicenses: string[];
  department?: string;
  lastSignIn?: string;
  accountEnabled: boolean;
}

// Mock license data (based on PowerShell Get-MgSubscribedSku results)
const mockLicenses: License[] = [
  {
    skuId: 'c42b9cae-ea4f-4ab7-9717-81576235ccac',
    skuPartNumber: 'SPE_E3',
    displayName: 'Microsoft 365 E3',
    total: 200,
    consumed: 145,
    available: 55,
    percentage: 72.5,
    warning: 3,
    suspended: 2,
    costPerMonth: 22.00,
    renewalDate: '2025-12-31',
    servicePlans: [
      { servicePlanId: '1', servicePlanName: 'Exchange Online Plan 2', appliesTo: 'User', provisioningStatus: 'Success' },
      { servicePlanId: '2', servicePlanName: 'SharePoint Online Plan 2', appliesTo: 'User', provisioningStatus: 'Success' },
      { servicePlanId: '3', servicePlanName: 'Microsoft Teams', appliesTo: 'User', provisioningStatus: 'Success' },
      { servicePlanId: '4', servicePlanName: 'Office Web Apps', appliesTo: 'User', provisioningStatus: 'Success' },
      { servicePlanId: '5', servicePlanName: 'Microsoft Defender for Office 365', appliesTo: 'User', provisioningStatus: 'Success' }
    ]
  },
  {
    skuId: '6fd2c87f-b296-42f0-b197-1e91e994b900',
    skuPartNumber: 'SPE_E5',
    displayName: 'Microsoft 365 E5',
    total: 50,
    consumed: 32,
    available: 18,
    percentage: 64,
    warning: 1,
    suspended: 0,
    costPerMonth: 38.00,
    renewalDate: '2025-12-31',
    servicePlans: [
      { servicePlanId: '6', servicePlanName: 'Exchange Online Plan 2', appliesTo: 'User', provisioningStatus: 'Success' },
      { servicePlanId: '7', servicePlanName: 'SharePoint Online Plan 2', appliesTo: 'User', provisioningStatus: 'Success' },
      { servicePlanId: '8', servicePlanName: 'Microsoft Teams', appliesTo: 'User', provisioningStatus: 'Success' },
      { servicePlanId: '9', servicePlanName: 'Power BI Pro', appliesTo: 'User', provisioningStatus: 'Success' },
      { servicePlanId: '10', servicePlanName: 'Microsoft Defender for Office 365 Plan 2', appliesTo: 'User', provisioningStatus: 'Success' }
    ]
  },
  {
    skuId: 'f245ecc8-75af-4f8e-b61f-27d8114de5f3',
    skuPartNumber: 'SPB',
    displayName: 'Microsoft 365 Business Premium',
    total: 100,
    consumed: 78,
    available: 22,
    percentage: 78,
    warning: 5,
    suspended: 1,
    costPerMonth: 15.00,
    renewalDate: '2025-06-30',
    servicePlans: [
      { servicePlanId: '11', servicePlanName: 'Exchange Online Plan 1', appliesTo: 'User', provisioningStatus: 'Success' },
      { servicePlanId: '12', servicePlanName: 'SharePoint Online Plan 1', appliesTo: 'User', provisioningStatus: 'Success' },
      { servicePlanId: '13', servicePlanName: 'Microsoft Teams', appliesTo: 'User', provisioningStatus: 'Success' },
      { servicePlanId: '14', servicePlanName: 'Microsoft Intune', appliesTo: 'User', provisioningStatus: 'Success' }
    ]
  },
  {
    skuId: '18181a46-0d4e-45cd-891e-60aabd171b4e',
    skuPartNumber: 'ENTERPRISEPACK',
    displayName: 'Office 365 E3',
    total: 150,
    consumed: 112,
    available: 38,
    percentage: 74.7,
    warning: 8,
    suspended: 3,
    costPerMonth: 20.00,
    renewalDate: '2025-09-15',
    servicePlans: [
      { servicePlanId: '15', servicePlanName: 'Exchange Online Plan 2', appliesTo: 'User', provisioningStatus: 'Success' },
      { servicePlanId: '16', servicePlanName: 'SharePoint Online Plan 2', appliesTo: 'User', provisioningStatus: 'Success' },
      { servicePlanId: '17', servicePlanName: 'Microsoft Teams', appliesTo: 'User', provisioningStatus: 'Success' },
      { servicePlanId: '18', servicePlanName: 'Office Applications', appliesTo: 'User', provisioningStatus: 'Success' }
    ]
  }
];

const mockUserLicenses: UserLicense[] = [
  {
    userId: '1',
    displayName: 'John Smith',
    userPrincipalName: 'john.smith@contoso.com',
    assignedLicenses: ['Microsoft 365 E5', 'Power BI Pro'],
    department: 'IT',
    lastSignIn: '2 hours ago',
    accountEnabled: true
  },
  {
    userId: '2',
    displayName: 'Jane Wilson',
    userPrincipalName: 'jane.wilson@contoso.com',
    assignedLicenses: ['Microsoft 365 E3'],
    department: 'HR',
    lastSignIn: '4 hours ago',
    accountEnabled: true
  },
  {
    userId: '3',
    displayName: 'Mike Johnson',
    userPrincipalName: 'mike.johnson@contoso.com',
    assignedLicenses: ['Microsoft 365 Business Premium'],
    department: 'Sales',
    lastSignIn: '1 day ago',
    accountEnabled: true
  }
];

const LicenseManagement: React.FC = () => {
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showUserLicenses, setShowUserLicenses] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Fetch licenses data
  const { data: licensesData, error: licensesError, isLoading: isLoadingLicenses, refetch: refetchLicenses } = 
    useGetLicensesQuery();
    
  // Fetch license usage data
  const { data: licenseUsageData, isLoading: isLoadingUsage } = 
    useGetLicenseUsageQuery();
    
  // Fetch license details when a license is selected
  const { data: licenseDetailsData, isLoading: isLoadingDetails } = 
    useGetLicenseQuery(selectedLicense?.skuId || '', { skip: !selectedLicense });
    
  // Convert API data to our component's expected format
  const [licenses, setLicenses] = useState<License[]>([]);
  
  // Update licenses state when API data changes
  useEffect(() => {
    if (licensesData && licenseUsageData) {
      // Combine license data with usage data
      const combinedLicenses = licensesData.map(license => {
        const usage = licenseUsageData.find(u => u.skuId === license.skuId);
        return {
          ...license,
          percentage: usage?.percentage || 0,
          warning: usage?.warningThreshold ? 1 : 0,
          suspended: 0 // Not available in the API, using default
        };
      });
      setLicenses(combinedLicenses);
    } else if (licensesData) {
      // If no usage data, use just license data
      setLicenses(licensesData.map(license => ({
        ...license,
        percentage: license.consumed > 0 ? Math.round((license.consumed / license.total) * 100) : 0,
        warning: 0,
        suspended: 0
      })));
    }
  }, [licensesData, licenseUsageData]);

  const getLicenseStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'error';
    if (percentage >= 75) return 'warning';
    return 'success';
  };

  const getUsageIcon = (percentage: number) => {
    if (percentage >= 90) return <TrendingUp color="error" />;
    if (percentage >= 75) return <Warning color="warning" />;
    return <CheckCircle color="success" />;
  };

  const totalLicenseCost = licenses.reduce((sum, license) => 
    sum + (license.consumed * (license.costPerMonth || 0)), 0
  );

  const LicenseCard = ({ license }: { license: License }) => (
    <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={() => setSelectedLicense(license)}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600, mb: 1 }}>
              {license.displayName}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {license.skuPartNumber} • Renews: {license.renewalDate}
            </Typography>
          </Box>
          {getUsageIcon(license.percentage)}
        </Box>

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">
              Usage: {license.consumed}/{license.total}
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {Math.round(license.percentage)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={license.percentage}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                backgroundColor: 
                  license.percentage >= 90 ? 'error.main' : 
                  license.percentage >= 75 ? 'warning.main' : 'success.main'
              }
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="body2" color="success.main">
            Available: {license.available}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ${license.costPerMonth}/month
          </Typography>
        </Box>

        {(license.warning > 0 || license.suspended > 0) && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {license.warning > 0 && (
              <Chip 
                label={`${license.warning} Warning`} 
                size="small" 
                color="warning" 
                icon={<Warning />}
              />
            )}
            {license.suspended > 0 && (
              <Chip 
                label={`${license.suspended} Suspended`} 
                size="small" 
                color="error" 
                icon={<Error />}
              />
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          License Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Search />}
            onClick={() => setShowUserLicenses(true)}
          >
            User Licenses
          </Button>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={() => refetchLicenses()}
            disabled={isLoadingLicenses}
          >
            {isLoadingLicenses ? 'Refreshing...' : 'Refresh Licenses'}
          </Button>
        </Box>
      </Box>

      {/* License Overview */}
      <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)', color: 'white' }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                License Portfolio Overview
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, mb: 2 }}>
                Total Cost: ${totalLicenseCost.toFixed(2)}/month • 
                {mockLicenses.reduce((sum, l) => sum + l.consumed, 0)} licenses assigned
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle fontSize="small" />
                  <Typography variant="body2">
                    {mockLicenses.reduce((sum, l) => sum + l.available, 0)} Available Licenses
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Warning fontSize="small" />
                  <Typography variant="body2">
                    {mockLicenses.reduce((sum, l) => sum + l.warning, 0)} Requiring Attention
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* License Cards */}
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
        License Types ({licenses.length})
      </Typography>
      
      {isLoadingLicenses ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography>Loading license data...</Typography>
          <LinearProgress sx={{ mt: 2, mb: 4 }} />
        </Box>
      ) : licensesError ? (
        <Alert severity="error" sx={{ mb: 4 }}>
          Error loading license data. Please try again later.
        </Alert>
      ) : licenses.length === 0 ? (
        <Alert severity="info" sx={{ mb: 4 }}>
          No license data available. Please check your tenant configuration.
        </Alert>
      ) : (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {licenses.map((license) => (
          <Grid item xs={12} sm={6} lg={4} xl={3} key={license.skuId}>
            <LicenseCard license={license} />
          </Grid>
          ))}
        </Grid>
      )}

      {/* License Summary Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
            <Assignment sx={{ mr: 1 }} />
            License Summary
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>License Name</TableCell>
                  <TableCell align="center">SKU</TableCell>
                  <TableCell align="center">Total</TableCell>
                  <TableCell align="center">Used</TableCell>
                  <TableCell align="center">Available</TableCell>
                  <TableCell align="center">Usage %</TableCell>
                  <TableCell align="center">Monthly Cost</TableCell>
                  <TableCell align="center">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoadingLicenses ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Box sx={{ p: 2 }}>
                        <Typography variant="body2">Loading license data...</Typography>
                        <LinearProgress sx={{ mt: 1 }} />
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : licenses.length > 0 ? licenses.map((license) => (
                  <TableRow key={license.skuId} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {license.displayName}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                        {license.skuPartNumber}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">{license.total}</TableCell>
                    <TableCell align="center">{license.consumed}</TableCell>
                    <TableCell align="center">
                      <Typography 
                        variant="body2" 
                        color={license.available < 10 ? 'error.main' : 'success.main'}
                        fontWeight="medium"
                      >
                        {license.available}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`${Math.round(license.percentage)}%`}
                        size="small"
                        color={getLicenseStatusColor(license.percentage)}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        ${(license.consumed * (license.costPerMonth || 0)).toFixed(0)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {license.percentage >= 90 ? (
                        <Chip label="Critical" size="small" color="error" />
                      ) : license.percentage >= 75 ? (
                        <Chip label="Warning" size="small" color="warning" />
                      ) : (
                        <Chip label="Healthy" size="small" color="success" />
                      )}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Alert severity="info" sx={{ my: 2 }}>
                        No license data available. Please check your tenant configuration.
                      </Alert>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* License Details Dialog */}
      <Dialog open={!!selectedLicense} onClose={() => setSelectedLicense(null)} maxWidth="md" fullWidth>
        {selectedLicense && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {selectedLicense.displayName} Details
                <Box>
                  <IconButton onClick={() => setShowAssignDialog(true)}>
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
                  <Typography variant="subtitle2" gutterBottom>License Information</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="SKU ID" secondary={selectedLicense.skuId} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="SKU Part Number" secondary={selectedLicense.skuPartNumber} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Total Licenses" secondary={selectedLicense.total} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Monthly Cost per License" secondary={`$${selectedLicense.costPerMonth}`} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Renewal Date" secondary={selectedLicense.renewalDate} />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Usage Statistics</Typography>
                  <Box sx={{ mb: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={selectedLicense.percentage}
                      sx={{ height: 12, borderRadius: 6 }}
                    />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {selectedLicense.consumed} of {selectedLicense.total} licenses used ({Math.round(selectedLicense.percentage)}%)
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6" color="success.main">{selectedLicense.available}</Typography>
                        <Typography variant="caption">Available</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6" color="primary.main">{selectedLicense.consumed}</Typography>
                        <Typography variant="caption">Assigned</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>

              <Typography variant="subtitle2" sx={{ mt: 3, mb: 2 }}>
                Service Plans ({selectedLicense.servicePlans.length})
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Service Plan</TableCell>
                      <TableCell>Applies To</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedLicense.servicePlans.map((plan) => (
                      <TableRow key={plan.servicePlanId}>
                        <TableCell>{plan.servicePlanName}</TableCell>
                        <TableCell>{plan.appliesTo}</TableCell>
                        <TableCell>
                          <Chip 
                            label={plan.provisioningStatus} 
                            size="small" 
                            color={plan.provisioningStatus === 'Success' ? 'success' : 'warning'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedLicense(null)}>Close</Button>
              <Button variant="contained" startIcon={<PersonAdd />}>
                Assign License
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* User Licenses Dialog */}
      <Dialog open={showUserLicenses} onClose={() => setShowUserLicenses(false)} maxWidth="lg" fullWidth>
        <DialogTitle>User License Assignments</DialogTitle>
        <DialogContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Assigned Licenses</TableCell>
                  <TableCell>Last Sign In</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoadingLicenses ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Box sx={{ p: 2 }}>
                        <Typography variant="body2">Loading license data...</Typography>
                        <LinearProgress sx={{ mt: 1 }} />
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Alert severity="info" sx={{ my: 2 }}>
                        No user license data available. Please check your tenant configuration.
                      </Alert>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUserLicenses(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LicenseManagement;