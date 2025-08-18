import React, { useState, useEffect } from 'react';
import { 
  Grid, Box, Typography, Card, CardContent, Chip, LinearProgress, 
  Alert, CircularProgress, Button, Divider 
} from '@mui/material';
import { 
  People, Group, Assignment, Business, TrendingUp, Warning, 
  CheckCircle, Error, Refresh 
} from '@mui/icons-material';
import { getDataService } from '../services/dataService';
import type { User, Group as GraphGroup, SubscribedSku } from '@microsoft/microsoft-graph-types';

const EnhancedDashboardLive: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<GraphGroup[]>([]);
  const [licenses, setLicenses] = useState<SubscribedSku[]>([]);
  const [orgInfo, setOrgInfo] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<{success: boolean; message: string} | null>(null);
  
  const dataService = getDataService();
  
  console.log('🚀 DASHBOARD: EnhancedDashboard-Live is loading...');
  console.log('🚀 DASHBOARD: DataService instance:', dataService);
  console.log('🚀 DASHBOARD: Using real API:', dataService.isUsingRealApi());

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Test connection first
      const testResult = await dataService.testConnection();
      setConnectionStatus(testResult);

      // Load all dashboard data in parallel
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

      console.log('Dashboard data loaded:', {
        users: usersData.length,
        groups: groupsData.length,
        licenses: licensesData.length,
        usingRealAPI: dataService.isUsingRealApi()
      });

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(`Failed to load dashboard data: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Calculate dashboard stats from real data
  const dashboardStats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.accountEnabled !== false).length,
    totalGroups: groups.length,
    securityGroups: groups.filter(g => g.securityEnabled && !g.groupTypes?.includes('Unified')).length,
    distributionLists: groups.filter(g => g.mailEnabled && !g.securityEnabled && !g.groupTypes?.includes('Unified')).length,
    microsoft365Groups: groups.filter(g => g.groupTypes?.includes('Unified')).length,
    totalLicenses: licenses.reduce((sum, sku) => sum + (sku.prepaidUnits?.enabled || 0), 0),
    usedLicenses: licenses.reduce((sum, sku) => sum + (sku.consumedUnits || 0), 0),
    availableLicenses: licenses.reduce((sum, sku) => sum + ((sku.prepaidUnits?.enabled || 0) - (sku.consumedUnits || 0)), 0),
  };

  const StatCard = ({ title, value, subtitle, icon, color = 'primary', loading = false }: any) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ color: `${color}.main`, mr: 1 }}>{icon}</Box>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        </Box>
        {loading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={24} />
            <Typography variant="body2">Loading...</Typography>
          </Box>
        ) : (
          <>
            <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
              {value.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  );

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6">Error Loading Dashboard</Typography>
          <Typography>{error}</Typography>
        </Alert>
        <Button variant="contained" startIcon={<Refresh />} onClick={loadDashboardData}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 0 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            {orgInfo?.displayName || 'Microsoft 365'} Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {dataService.isUsingRealApi() ? 'Live data from Microsoft Graph API' : 'Demo data (Azure AD not configured)'}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadDashboardData}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </Box>

      {/* Connection Status */}
      {connectionStatus && (
        <Alert 
          severity={connectionStatus.success ? 'success' : 'info'} 
          sx={{ mb: 3 }}
          icon={connectionStatus.success ? <CheckCircle /> : <Warning />}
        >
          <Typography variant="body2">
            <strong>Data Source:</strong> {connectionStatus.message}
          </Typography>
        </Alert>
      )}

      {/* Main Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={dashboardStats.totalUsers}
            subtitle={`${dashboardStats.activeUsers} active users`}
            icon={<People />}
            color="primary"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Groups"
            value={dashboardStats.totalGroups}
            subtitle={`${dashboardStats.microsoft365Groups} Microsoft 365 groups`}
            icon={<Group />}
            color="success"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Licenses"
            value={dashboardStats.totalLicenses}
            subtitle={`${dashboardStats.usedLicenses} assigned`}
            icon={<Assignment />}
            color="warning"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Available Licenses"
            value={dashboardStats.availableLicenses}
            subtitle={`${((dashboardStats.availableLicenses / (dashboardStats.totalLicenses || 1)) * 100).toFixed(1)}% available`}
            icon={<TrendingUp />}
            color="info"
            loading={isLoading}
          />
        </Grid>
      </Grid>

      {/* License Breakdown */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                License Distribution
              </Typography>
              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : licenses.length > 0 ? (
                <Box>
                  {licenses.map((license, index) => {
                    const total = license.prepaidUnits?.enabled || 0;
                    const used = license.consumedUnits || 0;
                    const utilization = total > 0 ? (used / total) * 100 : 0;

                    return (
                      <Box key={license.skuId || index} sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {license.skuPartNumber}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {used} / {total} ({utilization.toFixed(1)}%)
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={utilization}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: 'grey.200',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                              backgroundColor: utilization > 90 ? 'error.main' : utilization > 75 ? 'warning.main' : 'success.main'
                            }
                          }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Available: {total - used}
                          </Typography>
                          <Chip
                            label={utilization > 90 ? 'Critical' : utilization > 75 ? 'Warning' : 'Good'}
                            size="small"
                            color={utilization > 90 ? 'error' : utilization > 75 ? 'warning' : 'success'}
                          />
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                <Alert severity="info">
                  No license information available
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Group Breakdown
              </Typography>
              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                    <Typography variant="body2">Security Groups</Typography>
                    <Chip label={dashboardStats.securityGroups} size="small" color="error" />
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                    <Typography variant="body2">Distribution Lists</Typography>
                    <Chip label={dashboardStats.distributionLists} size="small" color="primary" />
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                    <Typography variant="body2">Microsoft 365 Groups</Typography>
                    <Chip label={dashboardStats.microsoft365Groups} size="small" color="success" />
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Organization Info */}
      {orgInfo && !isLoading && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Organization Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Organization</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
                  {orgInfo.displayName || 'N/A'}
                </Typography>
                
                <Typography variant="body2" color="text.secondary">Primary Domain</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {orgInfo.verifiedDomains?.find((d: any) => d.isDefault)?.name || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Country</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
                  {orgInfo.country || orgInfo.countryLetterCode || 'N/A'}
                </Typography>
                
                <Typography variant="body2" color="text.secondary">Business Phone</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {orgInfo.businessPhones?.[0] || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default EnhancedDashboardLive;