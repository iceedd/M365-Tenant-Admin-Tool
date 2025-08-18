import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip
} from '@mui/material';
import {
  Refresh,
  ExpandMore,
  ExpandLess,
  CheckCircle,
  Warning,
  Error,
  People,
  Group,
  Assignment,
  Domain,
  Email,
  Storage,
  Business,
  Security,
  Public,
  Schedule,
  Info,
  CloudQueue
} from '@mui/icons-material';

// Types based on PowerShell tenant discovery
interface TenantOverviewData {
  tenantInfo: {
    tenantId: string;
    tenantName: string;
    defaultDomain: string;
    country: string;
    lastDiscovery: string;
    connectionStatus: {
      microsoftGraph: boolean;
      exchangeOnline: boolean;
    };
  };
  summary: {
    totalUsers: number;
    activeUsers: number;
    guestUsers: number;
    totalGroups: number;
    securityGroups: number;
    distributionGroups: number;
    microsoft365Groups: number;
    totalLicenses: number;
    usedLicenses: number;
    domains: number;
    sharePointSites: number;
  };
  domains: Array<{
    name: string;
    isDefault: boolean;
    isVerified: boolean;
    authenticationType: string;
  }>;
  licenses: Array<{
    skuPartNumber: string;
    displayName: string;
    total: number;
    consumed: number;
    available: number;
    percentage: number;
  }>;
  users: Array<{
    id: string;
    displayName: string;
    userPrincipalName: string;
    department: string;
    jobTitle: string;
    lastSignIn: string;
    accountEnabled: boolean;
    userType: 'Member' | 'Guest';
  }>;
  groups: Array<{
    id: string;
    displayName: string;
    description: string;
    groupType: 'Security' | 'Distribution' | 'Microsoft365' | 'Mail-Enabled Security';
    memberCount: number;
    createdDateTime: string;
  }>;
  sharePointSites: Array<{
    id: string;
    displayName: string;
    url: string;
    template: string;
    storageUsed: number;
    lastModified: string;
  }>;
}

// Mock data based on PowerShell Start-TenantDiscovery results
const mockTenantData: TenantOverviewData = {
  tenantInfo: {
    tenantId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    tenantName: 'Contoso Corporation',
    defaultDomain: 'contoso.onmicrosoft.com',
    country: 'United Kingdom',
    lastDiscovery: new Date().toISOString(),
    connectionStatus: {
      microsoftGraph: true,
      exchangeOnline: true,
    },
  },
  summary: {
    totalUsers: 342,
    activeUsers: 298,
    guestUsers: 15,
    totalGroups: 45,
    securityGroups: 28,
    distributionGroups: 12,
    microsoft365Groups: 5,
    totalLicenses: 500,
    usedLicenses: 367,
    domains: 3,
    sharePointSites: 18,
  },
  domains: [
    { name: 'contoso.com', isDefault: true, isVerified: true, authenticationType: 'Managed' },
    { name: 'contoso.onmicrosoft.com', isDefault: false, isVerified: true, authenticationType: 'Managed' },
    { name: 'contoso.co.uk', isDefault: false, isVerified: true, authenticationType: 'Managed' },
  ],
  licenses: [
    { skuPartNumber: 'SPE_E3', displayName: 'Microsoft 365 E3', total: 200, consumed: 145, available: 55, percentage: 72.5 },
    { skuPartNumber: 'SPE_E5', displayName: 'Microsoft 365 E5', total: 50, consumed: 32, available: 18, percentage: 64 },
    { skuPartNumber: 'SPB', displayName: 'Microsoft 365 Business Premium', total: 100, consumed: 78, available: 22, percentage: 78 },
    { skuPartNumber: 'ENTERPRISEPACK', displayName: 'Office 365 E3', total: 150, consumed: 112, available: 38, percentage: 74.7 },
  ],
  users: [
    { id: '1', displayName: 'John Smith', userPrincipalName: 'john.smith@contoso.com', department: 'IT', jobTitle: 'Senior Developer', lastSignIn: '2 hours ago', accountEnabled: true, userType: 'Member' },
    { id: '2', displayName: 'Jane Wilson', userPrincipalName: 'jane.wilson@contoso.com', department: 'HR', jobTitle: 'HR Manager', lastSignIn: '4 hours ago', accountEnabled: true, userType: 'Member' },
    { id: '3', displayName: 'Mike Johnson', userPrincipalName: 'mike.johnson@contoso.com', department: 'Sales', jobTitle: 'Sales Rep', lastSignIn: '1 day ago', accountEnabled: true, userType: 'Member' },
    { id: '4', displayName: 'External Consultant', userPrincipalName: 'consultant@partner.com', department: '', jobTitle: 'Consultant', lastSignIn: '3 days ago', accountEnabled: true, userType: 'Guest' },
  ],
  groups: [
    { id: '1', displayName: 'IT Department', description: 'Information Technology team', groupType: 'Security', memberCount: 15, createdDateTime: '2023-01-15' },
    { id: '2', displayName: 'HR Team', description: 'Human Resources team', groupType: 'Microsoft365', memberCount: 8, createdDateTime: '2023-02-10' },
    { id: '3', displayName: 'All Employees', description: 'Company-wide distribution list', groupType: 'Distribution', memberCount: 325, createdDateTime: '2022-12-01' },
    { id: '4', displayName: 'IT Support', description: 'IT support mail-enabled security group', groupType: 'Mail-Enabled Security', memberCount: 5, createdDateTime: '2023-03-20' },
  ],
  sharePointSites: [
    { id: '1', displayName: 'IT Department', url: 'https://contoso.sharepoint.com/sites/IT', template: 'Team Site', storageUsed: 2.4, lastModified: '2 days ago' },
    { id: '2', displayName: 'Company Intranet', url: 'https://contoso.sharepoint.com/', template: 'Communication Site', storageUsed: 5.8, lastModified: '1 day ago' },
    { id: '3', displayName: 'HR Resources', url: 'https://contoso.sharepoint.com/sites/HR', template: 'Team Site', storageUsed: 1.2, lastModified: '3 hours ago' },
  ],
};

const TenantOverview: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    users: false,
    groups: false,
    sites: false,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate tenant discovery refresh (like PowerShell Start-TenantDiscovery)
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsRefreshing(false);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const StatusIndicator = ({ status, label }: { status: boolean; label: string }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {status ? <CheckCircle color="success" fontSize="small" /> : <Error color="error" fontSize="small" />}
      <Typography variant="body2">{label}</Typography>
    </Box>
  );

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

  return (
    <Box>
      {/* Header with Refresh */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Tenant Discovery Data
        </Typography>
        <Button
          variant="contained"
          startIcon={isRefreshing ? <CloudQueue /> : <Refresh />}
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? 'Discovering...' : 'Refresh Discovery'}
        </Button>
      </Box>

      {/* Discovery Progress */}
      {isRefreshing && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Running comprehensive tenant discovery... This may take 1-2 minutes.
          </Typography>
          <LinearProgress sx={{ mt: 1 }} />
        </Alert>
      )}

      {/* Tenant Information */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)', color: 'white' }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                {mockTenantData.tenantInfo.tenantName}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, mb: 2 }}>
                {mockTenantData.tenantInfo.defaultDomain} • {mockTenantData.tenantInfo.country}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Tenant ID: {mockTenantData.tenantInfo.tenantId}
              </Typography>
              <br />
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Last Discovery: {new Date(mockTenantData.tenantInfo.lastDiscovery).toLocaleString()}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <StatusIndicator 
                  status={mockTenantData.tenantInfo.connectionStatus.microsoftGraph} 
                  label="Microsoft Graph Connected" 
                />
                <StatusIndicator 
                  status={mockTenantData.tenantInfo.connectionStatus.exchangeOnline} 
                  label="Exchange Online Connected" 
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<People />}
            title="Total Users"
            value={mockTenantData.summary.totalUsers}
            subtitle={`${mockTenantData.summary.activeUsers} active, ${mockTenantData.summary.guestUsers} guests`}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Group />}
            title="Groups"
            value={mockTenantData.summary.totalGroups}
            subtitle={`${mockTenantData.summary.securityGroups} security, ${mockTenantData.summary.distributionGroups} distribution`}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Assignment />}
            title="Licenses"
            value={`${mockTenantData.summary.usedLicenses}/${mockTenantData.summary.totalLicenses}`}
            subtitle={`${mockTenantData.summary.totalLicenses - mockTenantData.summary.usedLicenses} available`}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Storage />}
            title="SharePoint Sites"
            value={mockTenantData.summary.sharePointSites}
            subtitle={`${mockTenantData.summary.domains} verified domains`}
            color="info"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Domains */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <Domain sx={{ mr: 1 }} />
                Verified Domains
              </Typography>
              <List dense>
                {mockTenantData.domains.map((domain, index) => (
                  <React.Fragment key={domain.name}>
                    <ListItem>
                      <ListItemIcon>
                        {domain.isDefault ? <CheckCircle color="primary" /> : <Public />}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">{domain.name}</Typography>
                            {domain.isDefault && <Chip label="Default" size="small" color="primary" />}
                            {domain.isVerified && <Chip label="Verified" size="small" color="success" />}
                          </Box>
                        }
                        secondary={`Authentication: ${domain.authenticationType}`}
                      />
                    </ListItem>
                    {index < mockTenantData.domains.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* License Utilization */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <Assignment sx={{ mr: 1 }} />
                License Utilization
              </Typography>
              {mockTenantData.licenses.map((license) => (
                <Box key={license.skuPartNumber} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" fontWeight="medium">
                      {license.displayName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {license.consumed}/{license.total} ({Math.round(license.percentage)}%)
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
                        backgroundColor: license.percentage > 80 ? 'error.main' : license.percentage > 60 ? 'warning.main' : 'success.main'
                      }
                    }}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Users */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                  <People sx={{ mr: 1 }} />
                  Recent Users ({mockTenantData.users.length} shown)
                </Typography>
                <IconButton onClick={() => toggleSection('users')}>
                  {expandedSections.users ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>
              <Collapse in={expandedSections.users}>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Display Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Department</TableCell>
                        <TableCell>Job Title</TableCell>
                        <TableCell>User Type</TableCell>
                        <TableCell>Last Sign In</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {mockTenantData.users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.displayName}</TableCell>
                          <TableCell>{user.userPrincipalName}</TableCell>
                          <TableCell>{user.department || '-'}</TableCell>
                          <TableCell>{user.jobTitle || '-'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={user.userType} 
                              size="small" 
                              color={user.userType === 'Member' ? 'primary' : 'secondary'} 
                            />
                          </TableCell>
                          <TableCell>{user.lastSignIn}</TableCell>
                          <TableCell>
                            <Chip 
                              label={user.accountEnabled ? 'Enabled' : 'Disabled'} 
                              size="small" 
                              color={user.accountEnabled ? 'success' : 'error'} 
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Collapse>
            </CardContent>
          </Card>
        </Grid>

        {/* Groups */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                  <Group sx={{ mr: 1 }} />
                  Groups ({mockTenantData.groups.length} shown)
                </Typography>
                <IconButton onClick={() => toggleSection('groups')}>
                  {expandedSections.groups ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>
              <Collapse in={expandedSections.groups}>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Group Name</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Members</TableCell>
                        <TableCell>Created</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {mockTenantData.groups.map((group) => (
                        <TableRow key={group.id}>
                          <TableCell>{group.displayName}</TableCell>
                          <TableCell>{group.description || '-'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={group.groupType} 
                              size="small" 
                              color={
                                group.groupType === 'Security' ? 'error' :
                                group.groupType === 'Microsoft365' ? 'primary' :
                                group.groupType === 'Distribution' ? 'secondary' : 'warning'
                              }
                            />
                          </TableCell>
                          <TableCell>{group.memberCount}</TableCell>
                          <TableCell>{new Date(group.createdDateTime).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Collapse>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TenantOverview;