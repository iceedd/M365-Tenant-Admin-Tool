import React from 'react';
import { Box } from '@mui/material';
import LicenseList from '../components/licenses/LicenseList';
import { License } from '../types';

const Licenses: React.FC = () => {
  const handleAssignLicense = (license: License) => {
    // TODO: Implement license assignment workflow
    console.log('Assign license:', license);
  };

  const handleManageLicense = (license: License) => {
    // TODO: Implement license management (view service plans, bulk operations, etc.)
    console.log('Manage license:', license);
  };

  return (
    <Box>
      <LicenseList
        onAssignLicense={handleAssignLicense}
        onManageLicense={handleManageLicense}
      />
    </Box>
  );
};

export default Licenses;