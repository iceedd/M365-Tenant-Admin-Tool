import React, { useState, useEffect } from 'react';
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
  CircularProgress
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
import { getDataService } from '../services/dataService';
import type { User, Group as GraphGroup, SubscribedSku } from '@microsoft/microsoft-graph-types';

const TenantManagementLive: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<GraphGroup[]>([]);
  const [licenses, setLicenses] = useState<SubscribedSku[]>([]);
  const [orgInfo, setOrgInfo] = useState<any>(null);

  const dataService = getDataService();

  const loadTenantData = async () => {
    try {
      console.log('🔄 Loading real tenant discovery data...');
      
      // Load all tenant data in parallel
      const [usersData, groupsData, licensesData, organizationData] = await Promise.all([
        dataService.getUsers().catch(err => { console.warn('Users failed:', err); return []; }),
        dataService.getGroups().catch(err => { console.warn('Groups failed:', err); return []; }),
        dataService.getSubscribedSkus().catch(err => { console.warn('Licenses failed:', err); return []; }),
        dataService.getOrganizationInfo().catch(err => { console.warn('Org info failed:', err); return null; })
      ]);

      setUsers(usersData);
      setGroups(groupsData);
      setLicenses(licensesData);
      setOrgInfo(organizationData);

      console.log('✅ Tenant discovery completed:', {
        users: usersData.length,
        groups: groupsData.length,
        licenses: licensesData.length,
        usingRealAPI: dataService.isUsingRealApi()
      });

    } catch (err) {
      console.error('❌ Failed to load tenant data:', err);
      setError(`Failed to load tenant data: ${err}`);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    await loadTenantData();
    setIsRefreshing(false);
  };

  useEffect(() => {
    const initializeTenantData = async () => {
      setIsLoading(true);
      await loadTenantData();
      setIsLoading(false);
    };

    initializeTenantData();
  }, []);

  // Calculate statistics from real data
  const tenantStats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.accountEnabled !== false).length,
    guestUsers: users.filter(u => u.userType === 'Guest').length,
    totalGroups: groups.length,
    securityGroups: groups.filter(g => g.securityEnabled && !g.groupTypes?.includes('Unified')).length,
    distributionGroups: groups.filter(g => g.mailEnabled && !g.securityEnabled && !g.groupTypes?.includes('Unified')).length,
    microsoft365Groups: groups.filter(g => g.groupTypes?.includes('Unified')).length,
    totalLicenses: licenses.reduce((sum, sku) => sum + (sku.prepaidUnits?.enabled || 0), 0),
    usedLicenses: licenses.reduce((sum, sku) => sum + (sku.consumedUnits || 0), 0),
    availableLicenses: licenses.reduce((sum, sku) => sum + ((sku.prepaidUnits?.enabled || 0) - (sku.consumedUnits || 0)), 0),
    domains: orgInfo?.verifiedDomains || []
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6">Loading Tenant Discovery Data...</Typography>
          <Typography variant="body2" color="text.secondary">
            This may take a moment while we gather your Microsoft 365 tenant information.
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
            Tenant Discovery Data
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {dataService.isUsingRealApi() ? 'Live data from Microsoft Graph API' : 'Demo data (Azure AD not configured)'}
          </Typography>
        </Box>
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
            {orgInfo?.displayName || 'Microsoft 365 Tenant'}
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, mb: 1 }}>
            {orgInfo?.verifiedDomains?.find((d: any) => d.isDefault)?.name || 'tenant.onmicrosoft.com'} • {orgInfo?.countryLetterCode || orgInfo?.country || 'Unknown Region'}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            Tenant ID: {orgInfo?.id || 'Loading...'}
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle fontSize="small" />
              <Typography variant="body2">
                {dataService.isUsingRealApi() ? 'Microsoft Graph Connected' : 'Demo Mode Active'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle fontSize="small" />
              <Typography variant="body2">
                {dataService.isUsingRealApi() ? 'Exchange Online Connected' : 'Demo Data Loaded'}
              </Typography>
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
                {tenantStats.totalUsers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {tenantStats.activeUsers} active, {tenantStats.guestUsers} guests
              </Typography>
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
                {tenantStats.totalGroups}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {tenantStats.securityGroups} security, {tenantStats.distributionGroups} distribution
              </Typography>
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
                {tenantStats.usedLicenses}/{tenantStats.totalLicenses}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {tenantStats.availableLicenses} available
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
                {tenantStats.domains.length}
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
              {tenantStats.domains.length > 0 ? (
                tenantStats.domains.map((domain: any, index: number) => (
                  <Box key={domain.name || index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2">{domain.name}</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {domain.isDefault && <Chip label="Default" size="small" color="primary" />}
                      {domain.isVerified !== false && <Chip label="Verified" size="small" color="success" />}
                    </Box>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No domain information available
                </Typography>
              )}
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
              {licenses.length > 0 ? (
                licenses.slice(0, 5).map((license) => {
                  const total = license.prepaidUnits?.enabled || 0;
                  const used = license.consumedUnits || 0;
                  const percentage = total > 0 ? (used / total) * 100 : 0;
                  
                  return (
                    <Box key={license.skuId} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" fontWeight="medium">
                          {license.skuPartNumber}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {used}/{total} ({Math.round(percentage)}%)
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
                })
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No license information available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TenantManagementLive;