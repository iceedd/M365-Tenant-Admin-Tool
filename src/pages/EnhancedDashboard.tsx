import React from 'react';
import { Grid, Box, Typography, Card, CardContent, Chip, LinearProgress } from '@mui/material';
import { People, Group, Assignment, Business, TrendingUp, Warning } from '@mui/icons-material';

// Enhanced Dashboard based on PowerShell tool's tenant discovery data
const EnhancedDashboard: React.FC = () => {
  // Mock data based on PowerShell tool's tenant discovery results
  const dashboardStats = {
    totalUsers: 342,
    activeUsers: 298,
    totalGroups: 45,
    securityGroups: 28,
    distributionLists: 12,
    microsoft365Groups: 5,
    totalLicenses: 500,
    usedLicenses: 367,
    availableLicenses: 133,
    tenantHealth: 'Good'
  };

  const licenseBreakdown = [
    { name: 'Microsoft 365 E3', total: 200, used: 145, available: 55 },
    { name: 'Microsoft 365 E5', total: 50, used: 32, available: 18 },
    { name: 'Business Premium', total: 100, used: 78, available: 22 },
    { name: 'Office 365 F3', total: 150, used: 112, available: 38 }
  ];

  const recentActivity = [
    { action: 'User Created', user: 'john.doe@contoso.com', time: '2 hours ago', status: 'success' },
    { action: 'Bulk Import', details: '15 users imported', time: '4 hours ago', status: 'success' },
    { action: 'License Assigned', user: 'jane.smith@contoso.com', time: '6 hours ago', status: 'success' },
    { action: 'Group Updated', details: 'IT Security Group', time: '1 day ago', status: 'warning' }
  ];

  const StatCard = ({ title, value, subtitle, icon, color = 'primary' }: any) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ color: `${color}.main`, mr: 1 }}>{icon}</Box>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Dashboard Overview
      </Typography>

      {/* Tenant Connection Status */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)', color: 'white' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Connected to: Contoso Corporation
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Tenant ID: contoso.onmicrosoft.com • Last Discovery: Just now
              </Typography>
            </Box>
            <Chip label="Microsoft Graph ✓" color="success" variant="filled" />
          </Box>
        </CardContent>
      </Card>

      {/* Key Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={dashboardStats.totalUsers}
            subtitle={`${dashboardStats.activeUsers} active users`}
            icon={<People />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Groups"
            value={dashboardStats.totalGroups}
            subtitle={`${dashboardStats.securityGroups} security, ${dashboardStats.distributionLists} distribution`}
            icon={<Group />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Licenses Used"
            value={`${dashboardStats.usedLicenses}/${dashboardStats.totalLicenses}`}
            subtitle={`${dashboardStats.availableLicenses} available`}
            icon={<Assignment />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tenant Health"
            value={dashboardStats.tenantHealth}
            subtitle="All services operational"
            icon={<TrendingUp />}
            color="info"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* License Utilization */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                License Utilization
              </Typography>
              {licenseBreakdown.map((license) => {
                const percentage = (license.used / license.total) * 100;
                return (
                  <Box key={license.name} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
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

        {/* Recent Activity */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Recent Activity
              </Typography>
              {recentActivity.map((activity, index) => (
                <Box key={index} sx={{ mb: 2, pb: 2, borderBottom: index < recentActivity.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" fontWeight="medium" sx={{ flexGrow: 1 }}>
                      {activity.action}
                    </Typography>
                    <Chip
                      size="small"
                      label={activity.status}
                      color={activity.status === 'success' ? 'success' : 'warning'}
                      variant="outlined"
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {activity.user || activity.details}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {activity.time}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EnhancedDashboard;