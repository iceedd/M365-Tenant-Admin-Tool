import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab, Paper } from '@mui/material';
import UserCreationForm from '../components/users/UserCreationForm';

// Enhanced Users page with tabbed interface (like PowerShell tool)
const EnhancedUsers: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
        User Management
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="User Creation" />
          <Tab label="User List" />
          <Tab label="Bulk Operations" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && <UserCreationForm />}
      
      {activeTab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>User List & Search</Typography>
          <Typography variant="body2" color="text.secondary">
            User list with filtering, search, and management features coming soon...
          </Typography>
        </Paper>
      )}
      
      {activeTab === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Bulk Operations</Typography>
          <Typography variant="body2" color="text.secondary">
            CSV import, bulk updates, and mass operations coming soon...
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default EnhancedUsers;