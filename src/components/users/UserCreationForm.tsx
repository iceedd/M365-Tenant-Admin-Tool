import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  FormControlLabel,
  Switch,
  InputAdornment,
  CircularProgress,
  Autocomplete,
  Divider,
  Paper
} from '@mui/material';
import {
  Refresh,
  Visibility,
  VisibilityOff,
  CheckCircle,
  Error,
  Person,
  Badge,
  Business,
  Email,
  Lock,
  Group,
  Assignment
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

// Types based on PowerShell tool structure
interface UserFormData {
  firstName: string;
  lastName: string;
  displayName: string;
  userPrincipalName: string;
  password: string;
  department: string;
  jobTitle: string;
  office: string;
  manager: string;
  licenseType: string;
  groups: string[];
  forcePasswordChange: boolean;
}

// Mock data from PowerShell tool patterns
const mockDepartments = ['IT', 'HR', 'Sales', 'Marketing', 'Finance', 'Operations', 'Legal'];
const mockOffices = [
  'United Kingdom - London',
  'United Kingdom - Manchester', 
  'United Kingdom - Birmingham',
  'United States - New York',
  'United States - Los Angeles',
  'Canada - Toronto'
];

const mockManagers = [
  { id: '1', displayName: 'John Smith (IT Director)', email: 'john.smith@contoso.com' },
  { id: '2', displayName: 'Jane Wilson (HR Director)', email: 'jane.wilson@contoso.com' },
  { id: '3', displayName: 'Mike Johnson (Sales Manager)', email: 'mike.johnson@contoso.com' }
];

const mockLicenses = [
  { id: 'SPE_E3', name: 'Microsoft 365 E3', available: 55 },
  { id: 'SPE_E5', name: 'Microsoft 365 E5', available: 18 },
  { id: 'SPB', name: 'Microsoft 365 Business Premium', available: 22 },
  { id: 'ENTERPRISEPACK', name: 'Office 365 E3', available: 12 }
];

const mockGroups = [
  { id: '1', name: 'IT Department', type: 'Security' },
  { id: '2', name: 'All Employees', type: 'Distribution' },
  { id: '3', name: 'HR Team', type: 'Microsoft 365' },
  { id: '4', name: 'IT Support', type: 'Mail-Enabled Security' },
  { id: '5', name: 'Developers', type: 'Security' },
  { id: '6', name: 'Managers', type: 'Distribution' }
];

const mockDomains = ['contoso.com', 'contoso.onmicrosoft.com'];

// Validation schema (only email/username, password, and license required)
const validationSchema = Yup.object({
  firstName: Yup.string().min(2, 'Too short'),
  lastName: Yup.string().min(2, 'Too short'),
  userPrincipalName: Yup.string()
    .email('Invalid email format')
    .required('Email/Username is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain uppercase, lowercase, number and special character'),
  department: Yup.string(),
  jobTitle: Yup.string(),
  licenseType: Yup.string().required('License is required')
});

const UserCreationForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [selectedDomain, setSelectedDomain] = useState(mockDomains[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const formik = useFormik<UserFormData>({
    initialValues: {
      firstName: '',
      lastName: '',
      displayName: '',
      userPrincipalName: '',
      password: '',
      department: '',
      jobTitle: '',
      office: '',
      manager: '',
      licenseType: '',
      groups: [],
      forcePasswordChange: true
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      setSubmitResult(null);
      
      try {
        // Simulate user creation (like PowerShell New-M365User)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setSubmitResult({
          type: 'success',
          message: `User ${values.displayName} (${values.userPrincipalName}) created successfully!`
        });
        
        // Reset form
        formik.resetForm();
        setUsernameStatus('idle');
        
      } catch (error) {
        setSubmitResult({
          type: 'error',
          message: 'Failed to create user. Please check your inputs and try again.'
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  });

  // Auto-generate display name (like PowerShell tool)
  useEffect(() => {
    if (formik.values.firstName && formik.values.lastName) {
      const displayName = `${formik.values.firstName} ${formik.values.lastName}`;
      formik.setFieldValue('displayName', displayName);
    }
  }, [formik.values.firstName, formik.values.lastName]);

  // Auto-generate username (like PowerShell tool)
  const generateUsername = () => {
    if (formik.values.firstName && formik.values.lastName) {
      const username = `${formik.values.firstName.toLowerCase()}.${formik.values.lastName.toLowerCase()}@${selectedDomain}`;
      formik.setFieldValue('userPrincipalName', username);
      checkUsernameAvailability(username);
    }
  };

  // Generate secure password (from PowerShell New-SecurePassword)
  const generatePassword = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one of each required character type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
    password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Special
    
    // Fill remaining characters
    for (let i = 4; i < 16; i++) {
      password += characters[Math.floor(Math.random() * characters.length)];
    }
    
    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    formik.setFieldValue('password', password);
  };

  // Check username availability (like PowerShell real-time validation)
  const checkUsernameAvailability = async (username: string) => {
    if (!username) return;
    
    setUsernameStatus('checking');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Mock validation - some usernames are "taken"
    const takenUsernames = ['admin@contoso.com', 'test@contoso.com', 'john.smith@contoso.com'];
    if (takenUsernames.includes(username)) {
      setUsernameStatus('taken');
    } else {
      setUsernameStatus('available');
    }
  };

  const getUsernameStatusIcon = () => {
    switch (usernameStatus) {
      case 'checking':
        return <CircularProgress size={20} />;
      case 'available':
        return <CheckCircle color="success" />;
      case 'taken':
        return <Error color="error" />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
            <Person sx={{ mr: 1 }} />
            Create New M365 User
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create a new Microsoft 365 user with full property support, license assignment, and group membership.
          </Typography>
        </Box>

        {submitResult && (
          <Alert 
            severity={submitResult.type} 
            sx={{ mb: 3 }}
            onClose={() => setSubmitResult(null)}
          >
            {submitResult.message}
          </Alert>
        )}

        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <Badge sx={{ mr: 1 }} />
                Basic Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="firstName"
                label="First Name"
                value={formik.values.firstName}
                onChange={formik.handleChange}
                error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                helperText={formik.touched.firstName && formik.errors.firstName}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="lastName"
                label="Last Name"
                value={formik.values.lastName}
                onChange={formik.handleChange}
                error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                helperText={formik.touched.lastName && formik.errors.lastName}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                name="displayName"
                label="Display Name"
                value={formik.values.displayName}
                onChange={formik.handleChange}
                helperText="Auto-generated from first and last name"
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>

            {/* Account Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', mt: 2 }}>
                <Email sx={{ mr: 1 }} />
                Account Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                name="userPrincipalName"
                label="Email/Username *"
                value={formik.values.userPrincipalName}
                onChange={(e) => {
                  formik.handleChange(e);
                  checkUsernameAvailability(e.target.value);
                }}
                error={formik.touched.userPrincipalName && Boolean(formik.errors.userPrincipalName)}
                helperText={
                  usernameStatus === 'taken' ? 'Username already exists' :
                  usernameStatus === 'available' ? 'Username available' :
                  formik.touched.userPrincipalName && formik.errors.userPrincipalName
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {getUsernameStatusIcon()}
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Button
                variant="outlined"
                onClick={generateUsername}
                disabled={!formik.values.firstName || !formik.values.lastName}
                fullWidth
                sx={{ height: 56 }}
              >
                Generate Username
              </Button>
            </Grid>

            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                name="password"
                label="Password *"
                type={showPassword ? 'text' : 'password'}
                value={formik.values.password}
                onChange={formik.handleChange}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Button
                variant="outlined"
                onClick={generatePassword}
                fullWidth
                startIcon={<Lock />}
                sx={{ height: 56 }}
              >
                Generate Password
              </Button>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formik.values.forcePasswordChange}
                    onChange={(e) => formik.setFieldValue('forcePasswordChange', e.target.checked)}
                  />
                }
                label="Force password change on first login"
              />
            </Grid>

            {/* Organization Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', mt: 2 }}>
                <Business sx={{ mr: 1 }} />
                Organization Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <Autocomplete
                freeSolo
                options={mockDepartments}
                value={formik.values.department}
                onChange={(_, newValue) => {
                  formik.setFieldValue('department', newValue || '');
                }}
                onInputChange={(_, newInputValue) => {
                  formik.setFieldValue('department', newInputValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    name="department"
                    label="Department"
                    error={formik.touched.department && Boolean(formik.errors.department)}
                    helperText={formik.touched.department && formik.errors.department}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="jobTitle"
                label="Job Title"
                value={formik.values.jobTitle}
                onChange={formik.handleChange}
                error={formik.touched.jobTitle && Boolean(formik.errors.jobTitle)}
                helperText={formik.touched.jobTitle && formik.errors.jobTitle}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Autocomplete
                freeSolo
                options={mockOffices}
                value={formik.values.office}
                onChange={(_, newValue) => {
                  formik.setFieldValue('office', newValue || '');
                }}
                onInputChange={(_, newInputValue) => {
                  formik.setFieldValue('office', newInputValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    name="office"
                    label="Office Location"
                    helperText="Type your own or select from suggestions"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Manager</InputLabel>
                <Select
                  name="manager"
                  value={formik.values.manager}
                  onChange={formik.handleChange}
                >
                  {mockManagers.map((manager) => (
                    <MenuItem key={manager.id} value={manager.email}>
                      {manager.displayName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* License & Groups */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', mt: 2 }}>
                <Assignment sx={{ mr: 1 }} />
                License & Group Assignment
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>License Type *</InputLabel>
                <Select
                  name="licenseType"
                  value={formik.values.licenseType}
                  onChange={formik.handleChange}
                  error={formik.touched.licenseType && Boolean(formik.errors.licenseType)}
                >
                  {mockLicenses.map((license) => (
                    <MenuItem key={license.id} value={license.id}>
                      {license.name} ({license.available} available)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <Autocomplete
                multiple
                options={mockGroups}
                getOptionLabel={(option) => `${option.name} (${option.type})`}
                value={mockGroups.filter(group => formik.values.groups.includes(group.id))}
                onChange={(_, selectedGroups) => {
                  formik.setFieldValue('groups', selectedGroups.map(g => g.id));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Groups"
                    placeholder="Select groups"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option.name}
                      size="small"
                      {...getTagProps({ index })}
                    />
                  ))
                }
              />
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isSubmitting || !formik.isValid}
                  startIcon={isSubmitting ? <CircularProgress size={20} /> : <Person />}
                  sx={{ minWidth: 200 }}
                >
                  {isSubmitting ? 'Creating User...' : 'Create User'}
                </Button>
                
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => {
                    formik.resetForm();
                    setUsernameStatus('idle');
                    setSubmitResult(null);
                  }}
                  disabled={isSubmitting}
                >
                  Reset Form
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default UserCreationForm;