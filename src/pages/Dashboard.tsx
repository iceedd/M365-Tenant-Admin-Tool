import React from 'react';
import { Grid, Box } from '@mui/material';
import DashboardOverview from '../components/dashboard/DashboardOverview';
import RecentActivity from '../components/dashboard/RecentActivity';
import LicenseUsageChart from '../components/dashboard/LicenseUsageChart';

const Dashboard: React.FC = () => {
  return (
    <Box>
      <Grid container spacing={3}>
        {/* Dashboard Overview */}
        <Grid item xs={12}>
          <DashboardOverview />
        </Grid>

        {/* License Usage Chart */}
        <Grid item xs={12} lg={8}>
          <LicenseUsageChart />
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} lg={4}>
          <RecentActivity limit={10} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;