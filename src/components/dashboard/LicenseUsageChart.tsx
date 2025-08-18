import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useGetLicenseUsageStatsQuery } from '../../store/api/dashboardApi';

const COLORS = [
  '#1976d2', // Primary blue
  '#dc004e', // Secondary pink
  '#2e7d32', // Success green
  '#ed6c02', // Warning orange
  '#9c27b0', // Purple
  '#d32f2f', // Error red
  '#0288d1', // Light blue
  '#f57c00', // Amber
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Box
        sx={{
          backgroundColor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          padding: 1,
          boxShadow: 1,
        }}
      >
        <Typography variant="subtitle2" gutterBottom>
          {data.licenseName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Used: {data.used.toLocaleString()}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Available: {data.available.toLocaleString()}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Total: {data.total.toLocaleString()}
        </Typography>
        <Typography variant="body2" color="primary.main">
          Usage: {((data.used / data.total) * 100).toFixed(1)}%
        </Typography>
      </Box>
    );
  }
  return null;
};

const LicenseUsageChart: React.FC = () => {
  const { data: licenseStats = [], isLoading, error } = useGetLicenseUsageStatsQuery();

  if (error) {
    return (
      <Card>
        <CardHeader title="License Usage" />
        <CardContent>
          <Alert severity="error">
            Failed to load license usage data.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader title="License Usage" />
        <CardContent>
          <Typography>Loading license data...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (licenseStats.length === 0) {
    return (
      <Card>
        <CardHeader title="License Usage" />
        <CardContent>
          <Alert severity="info">
            No license data available.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for pie chart (top 5 licenses by usage)
  const pieData = licenseStats
    .slice(0, 5)
    .map((license, index) => ({
      name: license.licenseName.length > 20 
        ? `${license.licenseName.substring(0, 20)}...` 
        : license.licenseName,
      value: license.used,
      usage: ((license.used / license.total) * 100).toFixed(1),
      color: COLORS[index % COLORS.length],
    }));

  // Prepare data for bar chart
  const barData = licenseStats.map((license) => ({
    name: license.licenseName.length > 15 
      ? `${license.licenseName.substring(0, 15)}...` 
      : license.licenseName,
    used: license.used,
    available: license.available,
    total: license.total,
    licenseName: license.licenseName,
  }));

  return (
    <Card>
      <CardHeader 
        title="License Usage" 
        subheader={`${licenseStats.length} license types`}
      />
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
          {/* Pie Chart */}
          <Box sx={{ flex: 1, minHeight: 300 }}>
            <Typography variant="h6" gutterBottom>
              Usage Distribution (Top 5)
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ usage }) => `${usage}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Box>

          {/* Bar Chart */}
          <Box sx={{ flex: 1, minHeight: 300 }}>
            <Typography variant="h6" gutterBottom>
              Detailed Usage
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="used" fill="#1976d2" name="Used" />
                <Bar dataKey="available" fill="#4caf50" name="Available" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Box>

        {/* Summary Stats */}
        <Box sx={{ marginTop: 3 }}>
          <Typography variant="h6" gutterBottom>
            Summary
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {licenseStats.slice(0, 3).map((license) => {
              const usagePercent = (license.used / license.total) * 100;
              return (
                <Box
                  key={license.licenseName}
                  sx={{
                    minWidth: 200,
                    padding: 2,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    backgroundColor: 'background.default',
                  }}
                >
                  <Typography variant="subtitle2" gutterBottom noWrap>
                    {license.licenseName}
                  </Typography>
                  <Typography variant="h6" color="primary.main">
                    {license.used} / {license.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {usagePercent.toFixed(1)}% utilized
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default LicenseUsageChart;