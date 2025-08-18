import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  LinearProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  Refresh,
  CheckCircle,
  People,
  Group,
  Assignment,
  Domain,
  CloudQueue
} from '@mui/icons-material';

const TenantManagementSimple: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRefreshing(false);
  };

  // Mock tenant data
  const tenantData = {
    tenantName: 'Contoso Corporation',
    tenantId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    totalUsers: 342,
    totalGroups: 45,
    totalLicenses: 500,
    usedLicenses: 367,
    domains: [
      { name: 'contoso.com', isDefault: true, isVerified: true },
      { name: 'contoso.onmicrosoft.com', isDefault: false, isVerified: true }
    ],
    licenses: [
      { name: 'Microsoft 365 E3', total: 200, used: 145 },
      { name: 'Microsoft 365 E5', total: 50, used: 32 },
      { name: 'Business Premium', total: 100, used: 78 }
    ]
  };

  return (
    <Box>
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

      {isRefreshing && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Running comprehensive tenant discovery... This may take 1-2 minutes.
          </Typography>
          <LinearProgress sx={{ mt: 1 }} />
        </Alert>
      )}

      {/* Tenant Info */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)', color: 'white' }}>
        <CardContent>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            {tenantData.tenantName}
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, mb: 1 }}>
            contoso.onmicrosoft.com • United Kingdom
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            Tenant ID: {tenantData.tenantId}
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle fontSize="small" />
              <Typography variant="body2">Microsoft Graph Connected</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle fontSize="small" />
              <Typography variant="body2">Exchange Online Connected</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <People sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">Total Users</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {tenantData.totalUsers}
              </Typography>
              <Typography variant="body2" color="text.secondary">298 active, 15 guests</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Group sx={{ color: 'secondary.main', mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">Groups</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {tenantData.totalGroups}
              </Typography>
              <Typography variant="body2" color="text.secondary">28 security, 12 distribution</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Assignment sx={{ color: 'success.main', mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">Licenses</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {tenantData.usedLicenses}/{tenantData.totalLicenses}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {tenantData.totalLicenses - tenantData.usedLicenses} available
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Domain sx={{ color: 'info.main', mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">Domains</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {tenantData.domains.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">All verified</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Domains and Licenses */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <Domain sx={{ mr: 1 }} />
                Verified Domains
              </Typography>
              {tenantData.domains.map((domain) => (
                <Box key={domain.name} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2">{domain.name}</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {domain.isDefault && <Chip label="Default" size="small" color="primary" />}
                    {domain.isVerified && <Chip label="Verified" size="small" color="success" />}
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <Assignment sx={{ mr: 1 }} />
                License Utilization
              </Typography>
              {tenantData.licenses.map((license) => {
                const percentage = (license.used / license.total) * 100;
                return (
                  <Box key={license.name} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {license.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {license.used}/{license.total} ({Math.round(percentage)}%)
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={percentage}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          backgroundColor: percentage > 80 ? 'error.main' : percentage > 60 ? 'warning.main' : 'success.main'
                        }
                      }}
                    />
                  </Box>
                );
              })}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TenantManagementSimple;