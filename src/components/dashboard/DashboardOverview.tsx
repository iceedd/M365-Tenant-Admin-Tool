import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  People as PeopleIcon,
  Group as GroupIcon,
  License as LicenseIcon,
  TrendingUp as TrendingUpIcon,
  PersonAdd as PersonAddIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { useGetDashboardMetricsQuery } from '../../store/api/dashboardApi';

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  progress?: {
    value: number;
    max: number;
  };
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color,
  trend,
  progress,
}) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" component="div" gutterBottom>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', marginTop: 1 }}>
                <TrendingUpIcon 
                  sx={{ 
                    fontSize: 16, 
                    marginRight: 0.5,
                    color: trend.isPositive ? 'success.main' : 'error.main',
                    transform: trend.isPositive ? 'none' : 'rotate(180deg)',
                  }} 
                />
                <Typography 
                  variant="caption" 
                  color={trend.isPositive ? 'success.main' : 'error.main'}
                >
                  {Math.abs(trend.value)}% from last month
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar sx={{ backgroundColor: color, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
        {progress && (
          <Box sx={{ marginTop: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Usage
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {progress.value} / {progress.max}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={(progress.value / progress.max) * 100}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const DashboardOverview: React.FC = () => {
  const { data: metrics, isLoading, error } = useGetDashboardMetricsQuery();

  if (isLoading) {
    return <Box>Loading dashboard...</Box>;
  }

  if (error || !metrics) {
    return <Box>Failed to load dashboard data</Box>;
  }

  const licenseUtilization = metrics.totalLicenses > 0 
    ? (metrics.usedLicenses / metrics.totalLicenses) * 100 
    : 0;

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Total Users */}
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Users"
            value={metrics.totalUsers.toLocaleString()}
            icon={<PeopleIcon />}
            color="primary.main"
            trend={{ value: 5.2, isPositive: true }}
          />
        </Grid>

        {/* Active Users */}
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Users"
            value={metrics.activeUsers.toLocaleString()}
            subtitle={`${((metrics.activeUsers / metrics.totalUsers) * 100).toFixed(1)}% of total`}
            icon={<PersonAddIcon />}
            color="success.main"
            progress={{
              value: metrics.activeUsers,
              max: metrics.totalUsers,
            }}
          />
        </Grid>

        {/* Total Groups */}
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Groups"
            value={metrics.totalGroups.toLocaleString()}
            icon={<GroupIcon />}
            color="info.main"
            trend={{ value: 2.1, isPositive: true }}
          />
        </Grid>

        {/* License Usage */}
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="License Usage"
            value={`${licenseUtilization.toFixed(1)}%`}
            subtitle={`${metrics.availableLicenses} available`}
            icon={<LicenseIcon />}
            color={licenseUtilization > 90 ? 'warning.main' : 'secondary.main'}
            progress={{
              value: metrics.usedLicenses,
              max: metrics.totalLicenses,
            }}
          />
        </Grid>

        {/* Inactive Users Alert */}
        {metrics.inactiveUsers > 0 && (
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Inactive Users"
              value={metrics.inactiveUsers.toLocaleString()}
              subtitle="Accounts disabled"
              icon={<SecurityIcon />}
              color="error.main"
            />
          </Grid>
        )}
      </Grid>

      {/* Quick Stats */}
      <Box sx={{ marginTop: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quick Stats
        </Typography>
        <Grid container spacing={2}>
          <Grid item>
            <Chip
              label={`${metrics.usersByDepartment.length} Departments`}
              color="primary"
              variant="outlined"
            />
          </Grid>
          <Grid item>
            <Chip
              label={`${metrics.licenseUsage.length} License Types`}
              color="secondary"
              variant="outlined"
            />
          </Grid>
          <Grid item>
            <Chip
              label={`${metrics.recentActivities.length} Recent Activities`}
              color="info"
              variant="outlined"
            />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default DashboardOverview;