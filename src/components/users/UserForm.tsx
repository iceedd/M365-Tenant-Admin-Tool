import React, { useEffect } from 'react';
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
  Grid,
  Box,
  Chip,
  Typography,
  Alert,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { User, CreateUserRequest, UpdateUserRequest } from '../../types';
import { 
  useCreateUserMutation, 
  useUpdateUserMutation,
  useGetDepartmentsQuery 
} from '../../store/api/usersApi';
import { useGetAvailableLicensesQuery } from '../../store/api/licensesApi';
import { useGetGroupsQuery } from '../../store/api/groupsApi';
import { useDispatch } from 'react-redux';
import { addNotification } from '../../store/slices/notificationSlice';

const createSchema = yup.object({
  userPrincipalName: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email'),
  displayName: yup.string().required('Display name is required'),
  givenName: yup.string().required('First name is required'),
  surname: yup.string().required('Last name is required'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters'),
  jobTitle: yup.string(),
  department: yup.string(),
  officeLocation: yup.string(),
  mobilePhone: yup.string(),
  usageLocation: yup.string(),
  accountEnabled: yup.boolean(),
});

const updateSchema = createSchema.omit(['password', 'userPrincipalName']);

interface UserFormProps {
  open: boolean;
  onClose: () => void;
  user?: User | null;
  mode: 'create' | 'edit';
}

const UserForm: React.FC<UserFormProps> = ({
  open,
  onClose,
  user,
  mode,
}) => {
  const dispatch = useDispatch();
  const isCreate = mode === 'create';
  
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  
  const { data: departments = [] } = useGetDepartmentsQuery();
  const { data: licenses = [] } = useGetAvailableLicensesQuery();
  const { data: groupsData } = useGetGroupsQuery({ 
    pagination: { page: 1, pageSize: 100 } 
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm({
    resolver: yupResolver(isCreate ? createSchema : updateSchema),
    defaultValues: {
      userPrincipalName: '',
      displayName: '',
      givenName: '',
      surname: '',
      password: '',
      jobTitle: '',
      department: '',
      officeLocation: '',
      mobilePhone: '',
      usageLocation: 'US',
      accountEnabled: true,
      assignLicenses: [] as string[],
      assignGroups: [] as string[],
    },
  });

  useEffect(() => {
    if (user && mode === 'edit') {
      reset({
        displayName: user.displayName,
        givenName: user.givenName,
        surname: user.surname,
        jobTitle: user.jobTitle || '',
        department: user.department || '',
        officeLocation: user.officeLocation || '',
        mobilePhone: user.mobilePhone || '',
        usageLocation: user.usageLocation || 'US',
        accountEnabled: user.accountEnabled,
      });
    } else {
      reset({
        userPrincipalName: '',
        displayName: '',
        givenName: '',
        surname: '',
        password: '',
        jobTitle: '',
        department: '',
        officeLocation: '',
        mobilePhone: '',
        usageLocation: 'US',
        accountEnabled: true,
        assignLicenses: [],
        assignGroups: [],
      });
    }
  }, [user, mode, reset]);

  const onSubmit = async (data: any) => {
    try {
      if (isCreate) {
        await createUser(data as CreateUserRequest).unwrap();
        dispatch(addNotification({
          type: 'success',
          title: 'User Created',
          message: `${data.displayName} has been created successfully.`,
        }));
      } else if (user) {
        await updateUser({ 
          id: user.id, 
          data: data as UpdateUserRequest 
        }).unwrap();
        dispatch(addNotification({
          type: 'success',
          title: 'User Updated',
          message: `${data.displayName} has been updated successfully.`,
        }));
      }
      onClose();
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        title: isCreate ? 'Creation Failed' : 'Update Failed',
        message: error?.data?.message || `Failed to ${isCreate ? 'create' : 'update'} user.`,
      }));
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{ sx: { minHeight: '80vh' } }}
    >
      <DialogTitle>
        {isCreate ? 'Create New User' : `Edit ${user?.displayName}`}
      </DialogTitle>
      
      <DialogContent>
        <Box component="form" sx={{ marginTop: 1 }}>
          <Grid container spacing={2}>
            {isCreate && (
              <Grid item xs={12}>
                <Controller
                  name="userPrincipalName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Email Address *"
                      type="email"
                      error={!!errors.userPrincipalName}
                      helperText={errors.userPrincipalName?.message}
                    />
                  )}
                />
              </Grid>
            )}
            
            <Grid item xs={12} sm={6}>
              <Controller
                name="givenName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="First Name *"
                    error={!!errors.givenName}
                    helperText={errors.givenName?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Controller
                name="surname"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Last Name *"
                    error={!!errors.surname}
                    helperText={errors.surname?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Controller
                name="displayName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Display Name *"
                    error={!!errors.displayName}
                    helperText={errors.displayName?.message}
                  />
                )}
              />
            </Grid>

            {isCreate && (
              <Grid item xs={12}>
                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Temporary Password *"
                      type="password"
                      error={!!errors.password}
                      helperText={errors.password?.message || 'User will be required to change password on first login'}
                    />
                  )}
                />
              </Grid>
            )}
            
            <Grid item xs={12} sm={6}>
              <Controller
                name="jobTitle"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Job Title"
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Controller
                name="department"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Department</InputLabel>
                    <Select {...field} label="Department">
                      <MenuItem value="">None</MenuItem>
                      {departments.map((dept) => (
                        <MenuItem key={dept} value={dept}>
                          {dept}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Controller
                name="officeLocation"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Office Location"
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Controller
                name="mobilePhone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Mobile Phone"
                    type="tel"
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Controller
                name="usageLocation"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Usage Location</InputLabel>
                    <Select {...field} label="Usage Location">
                      <MenuItem value="US">United States</MenuItem>
                      <MenuItem value="CA">Canada</MenuItem>
                      <MenuItem value="GB">United Kingdom</MenuItem>
                      <MenuItem value="DE">Germany</MenuItem>
                      <MenuItem value="FR">France</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Controller
                name="accountEnabled"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch {...field} checked={field.value} />}
                    label="Account Enabled"
                  />
                )}
              />
            </Grid>

            {isCreate && (
              <>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Assign Licenses (Optional)
                  </Typography>
                  <Controller
                    name="assignLicenses"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Licenses</InputLabel>
                        <Select
                          {...field}
                          multiple
                          label="Licenses"
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {(selected as string[]).map((value) => {
                                const license = licenses.find(l => l.skuId === value);
                                return (
                                  <Chip 
                                    key={value} 
                                    label={license?.skuPartNumber || value} 
                                    size="small" 
                                  />
                                );
                              })}
                            </Box>
                          )}
                        >
                          {licenses.map((license) => (
                            <MenuItem key={license.skuId} value={license.skuId}>
                              {license.skuPartNumber}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Assign to Groups (Optional)
                  </Typography>
                  <Controller
                    name="assignGroups"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Groups</InputLabel>
                        <Select
                          {...field}
                          multiple
                          label="Groups"
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {(selected as string[]).map((value) => {
                                const group = groupsData?.groups?.find(g => g.id === value);
                                return (
                                  <Chip 
                                    key={value} 
                                    label={group?.displayName || value} 
                                    size="small" 
                                  />
                                );
                              })}
                            </Box>
                          )}
                        >
                          {groupsData?.groups?.map((group) => (
                            <MenuItem key={group.id} value={group.id}>
                              {group.displayName}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          disabled={isCreating || isUpdating}
        >
          {isCreating || isUpdating ? 'Saving...' : (isCreate ? 'Create User' : 'Update User')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserForm;