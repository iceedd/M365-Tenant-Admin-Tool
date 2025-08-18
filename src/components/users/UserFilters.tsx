import React from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  Paper,
  Grid,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { setSearchFilters, clearSearchFilters } from '../../store/slices/uiSlice';
import { useGetDepartmentsQuery } from '../../store/api/usersApi';
import { useGetGroupsQuery } from '../../store/api/groupsApi';

const UserFilters: React.FC = () => {
  const dispatch = useDispatch();
  const { searchFilters } = useSelector((state: RootState) => state.ui);
  
  const { data: departments = [] } = useGetDepartmentsQuery();
  const { data: groupsData } = useGetGroupsQuery({ 
    pagination: { page: 1, pageSize: 100 } 
  });

  const handleFilterChange = (field: string, value: any) => {
    dispatch(setSearchFilters({ [field]: value }));
  };

  const handleClearFilters = () => {
    dispatch(clearSearchFilters());
  };

  const activeFiltersCount = Object.values(searchFilters).filter(
    (value) => value !== '' && value !== null
  ).length;

  return (
    <Paper sx={{ padding: 2, marginBottom: 2 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            placeholder="Search users..."
            value={searchFilters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ marginRight: 1, color: 'text.secondary' }} />,
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={2}>
          <FormControl fullWidth>
            <InputLabel>Department</InputLabel>
            <Select
              value={searchFilters.department}
              label="Department"
              onChange={(e) => handleFilterChange('department', e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {departments.map((dept) => (
                <MenuItem key={dept} value={dept}>
                  {dept}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={2}>
          <FormControl fullWidth>
            <InputLabel>Account Status</InputLabel>
            <Select
              value={searchFilters.accountEnabled ?? ''}
              label="Account Status"
              onChange={(e) => {
                const value = e.target.value === '' ? null : e.target.value === 'true';
                handleFilterChange('accountEnabled', value);
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={2}>
          <FormControl fullWidth>
            <InputLabel>License Status</InputLabel>
            <Select
              value={searchFilters.hasLicense ?? ''}
              label="License Status"
              onChange={(e) => {
                const value = e.target.value === '' ? null : e.target.value === 'true';
                handleFilterChange('hasLicense', value);
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="true">Licensed</MenuItem>
              <MenuItem value="false">Unlicensed</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={2}>
          <FormControl fullWidth>
            <InputLabel>Group</InputLabel>
            <Select
              value={searchFilters.groupId}
              label="Group"
              onChange={(e) => handleFilterChange('groupId', e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {groupsData?.groups?.map((group) => (
                <MenuItem key={group.id} value={group.id}>
                  {group.displayName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={1}>
          <Button
            fullWidth
            variant="outlined"
            onClick={handleClearFilters}
            disabled={activeFiltersCount === 0}
            startIcon={<ClearIcon />}
          >
            Clear
          </Button>
        </Grid>
      </Grid>
      
      {activeFiltersCount > 0 && (
        <Box sx={{ marginTop: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {searchFilters.search && (
            <Chip
              label={`Search: ${searchFilters.search}`}
              onDelete={() => handleFilterChange('search', '')}
              size="small"
            />
          )}
          {searchFilters.department && (
            <Chip
              label={`Department: ${searchFilters.department}`}
              onDelete={() => handleFilterChange('department', '')}
              size="small"
            />
          )}
          {searchFilters.accountEnabled !== null && (
            <Chip
              label={`Status: ${searchFilters.accountEnabled ? 'Active' : 'Inactive'}`}
              onDelete={() => handleFilterChange('accountEnabled', null)}
              size="small"
            />
          )}
          {searchFilters.hasLicense !== null && (
            <Chip
              label={`License: ${searchFilters.hasLicense ? 'Licensed' : 'Unlicensed'}`}
              onDelete={() => handleFilterChange('hasLicense', null)}
              size="small"
            />
          )}
          {searchFilters.groupId && (
            <Chip
              label={`Group: ${groupsData?.groups?.find(g => g.id === searchFilters.groupId)?.displayName}`}
              onDelete={() => handleFilterChange('groupId', '')}
              size="small"
            />
          )}
        </Box>
      )}
    </Paper>
  );
};

export default UserFilters;