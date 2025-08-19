import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Box,
  Typography,
  Grid,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Autocomplete,
  FormHelperText,
  Card,
  CardContent,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Security,
  Email,
  GroupWork,
  Shield,
  Public,
  VpnLock,
  Info,
  Warning,
  CheckCircle,
  ExpandMore,
  PersonAdd,
  Settings,
  Label,
  Business
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { getDataService } from '../../services/dataService';
import type { User } from '@microsoft/microsoft-graph-types';

interface GroupCreationFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (groupData: any) => void;
}

// Interface for user options in autocomplete
interface UserOption {
  id: string;
  displayName: string;
  userPrincipalName: string;
  department?: string;
}

const classificationOptions = [
  { value: 'public', label: 'Public', description: 'Everyone can view this group' },
  { value: 'internal', label: 'Internal', description: 'Only organization members can view' },
  { value: 'confidential', label: 'Confidential', description: 'Restricted access only' }
];

const sensitivityLabels = [
  { value: 'general', label: 'General', description: 'Standard business information' },
  { value: 'confidential', label: 'Confidential', description: 'Sensitive business information' },
  { value: 'highly-confidential', label: 'Highly Confidential', description: 'Restricted information' }
];

// Validation schema based on PowerShell group creation requirements
const validationSchema = Yup.object({
  displayName: Yup.string()
    .required('Group name is required')
    .min(2, 'Group name must be at least 2 characters')
    .max(256, 'Group name cannot exceed 256 characters')
    .matches(/^[^<>(){}[\]\\.,;:\s@"]+(\s+[^<>(){}[\]\\.,;:\s@"]+)*$/, 'Invalid characters in group name'),
  
  mailNickname: Yup.string()
    .when(['groupType', 'mailEnabled'], {
      is: (groupType: string, mailEnabled: boolean) => 
        groupType === 'Distribution' || groupType === 'Microsoft365' || groupType === 'Mail-Enabled Security' || mailEnabled,
      then: (schema) => schema
        .required('Mail nickname is required for mail-enabled groups')
        .min(1, 'Mail nickname is required')
        .max(64, 'Mail nickname cannot exceed 64 characters')
        .matches(/^[a-zA-Z0-9._-]+$/, 'Mail nickname can only contain letters, numbers, periods, hyphens, and underscores'),
      otherwise: (schema) => schema.nullable()
    }),
  
  description: Yup.string()
    .max(1024, 'Description cannot exceed 1024 characters'),
  
  groupType: Yup.string()
    .required('Group type is required')
    .oneOf(['Security', 'Distribution', 'Microsoft365', 'Mail-Enabled Security'], 'Invalid group type'),
  
  visibility: Yup.string()
    .required('Visibility is required')
    .oneOf(['Public', 'Private'], 'Invalid visibility option'),
  
  joinPolicy: Yup.string()
    .required('Join policy is required')
    .oneOf(['Open', 'Closed', 'Owner Approval'], 'Invalid join policy'),
  
  owners: Yup.array()
    .min(1, 'At least one owner is required')
    .required('Group owners are required'),
  
  members: Yup.array()
    .default([])
});

const steps = ['Basic Information', 'Settings & Permissions', 'Members & Owners', 'Review & Create'];

const GroupCreationForm: React.FC<GroupCreationFormProps> = ({ open, onClose, onSubmit }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<UserOption[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [currentDomain, setCurrentDomain] = useState('contoso.com');
  const [createError, setCreateError] = useState<string | null>(null);
  
  const dataService = getDataService();

  // Load available users for autocomplete
  useEffect(() => {
    const loadUsers = async () => {
      if (!open) return;
      
      setIsLoadingUsers(true);
      try {
        const users = await dataService.getUsers(['id', 'displayName', 'userPrincipalName', 'department']);
        const userOptions: UserOption[] = users.map(user => ({
          id: user.id || '',
          displayName: user.displayName || '',
          userPrincipalName: user.userPrincipalName || '',
          department: user.department || undefined
        }));
        
        setAvailableUsers(userOptions);
        
        // Extract domain from first user for email generation
        if (userOptions.length > 0 && userOptions[0].userPrincipalName) {
          const domain = userOptions[0].userPrincipalName.split('@')[1];
          setCurrentDomain(domain);
        }
        
        console.log(`Loaded ${userOptions.length} users for group creation`);
      } catch (error) {
        console.warn('Failed to load users for group creation:', error);
        // Keep empty array if loading fails
        setAvailableUsers([]);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    loadUsers();
  }, [open, dataService]);

  const formik = useFormik({
    initialValues: {
      displayName: '',
      mailNickname: '',
      description: '',
      groupType: 'Security',
      visibility: 'Private',
      joinPolicy: 'Closed',
      mailEnabled: false,
      securityEnabled: true,
      classification: 'internal',
      sensitivityLabel: 'general',
      owners: [],
      members: [],
      welcomeEmailDisabled: false,
      hideFromAddressLists: false,
      allowOnlyMembersToPost: true
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsCreating(true);
      setCreateError(null);
      try {
        // Call the parent's onSubmit handler (which will handle the real API call)
        await onSubmit(values);
        handleClose();
      } catch (error) {
        console.error('Error creating group:', error);
        
        // Extract meaningful error message
        let errorMessage = 'Unknown error occurred';
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        
        setCreateError(errorMessage);
        // Keep the dialog open if there's an error so user can see the issue
      } finally {
        setIsCreating(false);
      }
    }
  });

  const handleClose = () => {
    formik.resetForm();
    setActiveStep(0);
    setCreateError(null);
    onClose();
  };

  const handleNext = () => {
    // Validate current step before proceeding
    const currentStepFields = getStepFields(activeStep);
    const hasErrors = currentStepFields.some(field => 
      formik.errors[field as keyof typeof formik.errors] && formik.touched[field as keyof typeof formik.touched]
    );
    
    if (!hasErrors) {
      setActiveStep((prevStep) => prevStep + 1);
    } else {
      // Touch fields to show validation errors
      currentStepFields.forEach(field => {
        formik.setFieldTouched(field, true);
      });
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const getStepFields = (step: number): string[] => {
    switch (step) {
      case 0:
        return ['displayName', 'description', 'groupType'];
      case 1:
        return ['visibility', 'joinPolicy', 'mailNickname'];
      case 2:
        return ['owners'];
      default:
        return [];
    }
  };

  // Handle group type changes without circular dependencies
  const handleGroupTypeChange = (event: any) => {
    const groupType = event.target.value;
    
    // Auto-set mail properties based on group type
    let mailEnabled = false;
    let securityEnabled = true;

    switch (groupType) {
      case 'Distribution':
        mailEnabled = true;
        securityEnabled = false;
        break;
      case 'Microsoft365':
        mailEnabled = true;
        securityEnabled = false;
        break;
      case 'Mail-Enabled Security':
        mailEnabled = true;
        securityEnabled = true;
        break;
      case 'Security':
      default:
        mailEnabled = false;
        securityEnabled = true;
        break;
    }

    // Update all values in a single batch to avoid multiple re-renders
    formik.setValues(prev => ({
      ...prev,
      groupType,
      mailEnabled,
      securityEnabled,
      mailNickname: mailEnabled && prev.displayName && !formik.touched.mailNickname ? 
        prev.displayName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20) : 
        prev.mailNickname
    }));
  };

  // Handle display name changes for auto-nickname generation
  const handleDisplayNameChange = (event: any) => {
    const displayName = event.target.value;
    
    // Auto-generate mail nickname if mail is enabled and nickname hasn't been manually touched
    const shouldAutoGenerate = formik.values.mailEnabled && !formik.touched.mailNickname;
    const nickname = shouldAutoGenerate ? 
      displayName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20) : 
      formik.values.mailNickname;

    formik.setValues(prev => ({
      ...prev,
      displayName,
      mailNickname: nickname
    }));
  };

  const getGroupTypeIcon = (groupType: string) => {
    switch (groupType) {
      case 'Security':
        return <Security color="error" />;
      case 'Distribution':
        return <Email color="primary" />;
      case 'Microsoft365':
        return <GroupWork color="secondary" />;
      case 'Mail-Enabled Security':
        return <Shield color="warning" />;
      default:
        return <Security />;
    }
  };

  const getGroupTypeDescription = (groupType: string) => {
    switch (groupType) {
      case 'Security':
        return 'Used to manage access to resources. Members can be assigned permissions.';
      case 'Distribution':
        return 'Used for email distribution. Members receive emails sent to the group.';
      case 'Microsoft365':
        return 'Provides collaboration workspace with Teams, SharePoint, and shared mailbox.';
      case 'Mail-Enabled Security':
        return 'Combines security group functionality with email distribution capabilities.';
      default:
        return '';
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Basic Group Information</Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Group Name"
                  name="displayName"
                  value={formik.values.displayName}
                  onChange={handleDisplayNameChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.displayName && Boolean(formik.errors.displayName)}
                  helperText={formik.touched.displayName && formik.errors.displayName}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  name="description"
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.description && Boolean(formik.errors.description)}
                  helperText={formik.touched.description && formik.errors.description}
                  placeholder="Describe the purpose and scope of this group..."
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Group Type</InputLabel>
                  <Select
                    name="groupType"
                    value={formik.values.groupType}
                    onChange={handleGroupTypeChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.groupType && Boolean(formik.errors.groupType)}
                    label="Group Type"
                  >
                    <MenuItem value="Security">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Security color="error" sx={{ mr: 1 }} />
                        Security Group
                      </Box>
                    </MenuItem>
                    <MenuItem value="Distribution">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Email color="primary" sx={{ mr: 1 }} />
                        Distribution List
                      </Box>
                    </MenuItem>
                    <MenuItem value="Microsoft365">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <GroupWork color="secondary" sx={{ mr: 1 }} />
                        Microsoft 365 Group
                      </Box>
                    </MenuItem>
                    <MenuItem value="Mail-Enabled Security">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Shield color="warning" sx={{ mr: 1 }} />
                        Mail-Enabled Security Group
                      </Box>
                    </MenuItem>
                  </Select>
                  {formik.touched.groupType && formik.errors.groupType && (
                    <FormHelperText error>{formik.errors.groupType}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Alert severity="info" icon={<Info />}>
                  <Typography variant="body2">
                    <strong>{formik.values.groupType}:</strong> {getGroupTypeDescription(formik.values.groupType)}
                  </Typography>
                </Alert>
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Settings & Permissions</Typography>

            <Grid container spacing={3}>
              {formik.values.mailEnabled && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Mail Nickname"
                    name="mailNickname"
                    value={formik.values.mailNickname}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.mailNickname && Boolean(formik.errors.mailNickname)}
                    helperText={
                      (formik.touched.mailNickname && formik.errors.mailNickname) ||
                      `Email will be: ${formik.values.mailNickname || 'nickname'}@${currentDomain}`
                    }
                    required={formik.values.mailEnabled}
                  />
                </Grid>
              )}

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Visibility</InputLabel>
                  <Select
                    name="visibility"
                    value={formik.values.visibility}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    label="Visibility"
                  >
                    <MenuItem value="Public">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Public sx={{ mr: 1 }} />
                        Public
                      </Box>
                    </MenuItem>
                    <MenuItem value="Private">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <VpnLock sx={{ mr: 1 }} />
                        Private
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Join Policy</InputLabel>
                  <Select
                    name="joinPolicy"
                    value={formik.values.joinPolicy}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    label="Join Policy"
                  >
                    <MenuItem value="Open">Open (Anyone can join)</MenuItem>
                    <MenuItem value="Closed">Closed (Owner must add members)</MenuItem>
                    <MenuItem value="Owner Approval">Owner Approval Required</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Classification</InputLabel>
                  <Select
                    name="classification"
                    value={formik.values.classification}
                    onChange={formik.handleChange}
                    label="Classification"
                  >
                    {classificationOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Sensitivity Label</InputLabel>
                  <Select
                    name="sensitivityLabel"
                    value={formik.values.sensitivityLabel}
                    onChange={formik.handleChange}
                    label="Sensitivity Label"
                  >
                    {sensitivityLabels.map((label) => (
                      <MenuItem key={label.value} value={label.value}>
                        {label.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {formik.values.mailEnabled && (
                <Grid item xs={12}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="subtitle2">Advanced Email Settings</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={formik.values.welcomeEmailDisabled}
                                onChange={(e) => formik.setFieldValue('welcomeEmailDisabled', e.target.checked)}
                              />
                            }
                            label="Disable welcome email to new members"
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={formik.values.hideFromAddressLists}
                                onChange={(e) => formik.setFieldValue('hideFromAddressLists', e.target.checked)}
                              />
                            }
                            label="Hide from address lists"
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={formik.values.allowOnlyMembersToPost}
                                onChange={(e) => formik.setFieldValue('allowOnlyMembersToPost', e.target.checked)}
                              />
                            }
                            label="Only members can send to this group"
                          />
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                </Grid>
              )}
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Members & Owners</Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  options={availableUsers}
                  loading={isLoadingUsers}
                  getOptionLabel={(option) => `${option.displayName} (${option.userPrincipalName})`}
                  value={formik.values.owners}
                  onChange={(_, value) => formik.setFieldValue('owners', value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Group Owners"
                      error={formik.touched.owners && Boolean(formik.errors.owners)}
                      helperText={
                        (formik.touched.owners && formik.errors.owners) ||
                        'Owners can manage group members and settings'
                      }
                      required
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        {...getTagProps({ index })}
                        key={option.id}
                        label={option.displayName}
                        icon={<PersonAdd />}
                        color="primary"
                      />
                    ))
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  options={availableUsers.filter(user => 
                    !formik.values.owners.some(owner => owner.id === user.id)
                  )}
                  loading={isLoadingUsers}
                  getOptionLabel={(option) => `${option.displayName} (${option.userPrincipalName})`}
                  value={formik.values.members}
                  onChange={(_, value) => formik.setFieldValue('members', value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Initial Members (Optional)"
                      helperText="Add users who should be members when the group is created"
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        {...getTagProps({ index })}
                        key={option.id}
                        label={option.displayName}
                        variant="outlined"
                      />
                    ))
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    Group owners will automatically be added as members. You can add additional members after creating the group.
                  </Typography>
                </Alert>
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Review & Create</Typography>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {getGroupTypeIcon(formik.values.groupType)}
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    {formik.values.displayName}
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <List dense>
                      <ListItem>
                        <ListItemIcon><Settings /></ListItemIcon>
                        <ListItemText 
                          primary="Group Type" 
                          secondary={formik.values.groupType}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          {formik.values.visibility === 'Public' ? <Public /> : <VpnLock />}
                        </ListItemIcon>
                        <ListItemText 
                          primary="Visibility" 
                          secondary={formik.values.visibility}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><Label /></ListItemIcon>
                        <ListItemText 
                          primary="Classification" 
                          secondary={formik.values.classification}
                        />
                      </ListItem>
                    </List>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <List dense>
                      {formik.values.mailEnabled && (
                        <ListItem>
                          <ListItemIcon><Email /></ListItemIcon>
                          <ListItemText 
                            primary="Email Address" 
                            secondary={`${formik.values.mailNickname}@${currentDomain}`}
                          />
                        </ListItem>
                      )}
                      <ListItem>
                        <ListItemIcon><PersonAdd /></ListItemIcon>
                        <ListItemText 
                          primary="Owners" 
                          secondary={`${formik.values.owners.length} selected`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><People /></ListItemIcon>
                        <ListItemText 
                          primary="Initial Members" 
                          secondary={`${formik.values.members.length} selected`}
                        />
                      </ListItem>
                    </List>
                  </Grid>
                </Grid>

                {formik.values.description && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      <strong>Description:</strong> {formik.values.description}
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>

            <Alert severity="success" icon={<CheckCircle />}>
              <Typography variant="body2">
                Ready to create group. This will create the group and add the specified owners and members.
              </Typography>
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h5">Create New Group</Typography>
        <Typography variant="body2" color="text.secondary">
          Step {activeStep + 1} of {steps.length}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {createError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Failed to create group:</strong> {createError}
            </Typography>
          </Alert>
        )}

        <form onSubmit={formik.handleSubmit}>
          {renderStepContent(activeStep)}
        </form>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isCreating}>
          Cancel
        </Button>
        
        <Box sx={{ flex: '1 1 auto' }} />
        
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={isCreating}>
            Back
          </Button>
        )}
        
        {activeStep < steps.length - 1 ? (
          <Button variant="contained" onClick={handleNext} disabled={isCreating}>
            Next
          </Button>
        ) : (
          <Button 
            variant="contained" 
            onClick={formik.submitForm}
            disabled={isCreating || !formik.isValid}
          >
            {isCreating ? 'Creating Group...' : 'Create Group'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default GroupCreationForm;