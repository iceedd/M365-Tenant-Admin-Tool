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
  FormHelperText,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Group, CreateGroupRequest } from '../../types';
import { 
  useCreateGroupMutation, 
  useUpdateGroupMutation,
} from '../../store/api/groupsApi';
import { useGetUsersQuery } from '../../store/api/usersApi';
import { useDispatch } from 'react-redux';
import { addNotification } from '../../store/slices/notificationSlice';

const schema = yup.object({
  displayName: yup.string().required('Group name is required'),
  description: yup.string(),
  groupTypes: yup.array().of(yup.string()),
  mailEnabled: yup.boolean(),
  mailNickname: yup.string().when('mailEnabled', {
    is: true,
    then: (schema) => schema.required('Mail nickname is required when mail is enabled'),
    otherwise: (schema) => schema,
  }),
  securityEnabled: yup.boolean(),
  owners: yup.array().of(yup.string()),
  members: yup.array().of(yup.string()),
});

interface GroupFormProps {
  open: boolean;
  onClose: () => void;
  group?: Group | null;
  mode: 'create' | 'edit';
}

const GroupForm: React.FC<GroupFormProps> = ({
  open,
  onClose,
  group,
  mode,
}) => {
  const dispatch = useDispatch();
  const isCreate = mode === 'create';
  
  const [createGroup, { isLoading: isCreating }] = useCreateGroupMutation();
  const [updateGroup, { isLoading: isUpdating }] = useUpdateGroupMutation();
  
  const { data: usersData } = useGetUsersQuery({ 
    pagination: { page: 1, pageSize: 100 } 
  });

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateGroupRequest>({
    resolver: yupResolver(schema),
    defaultValues: {
      displayName: '',
      description: '',
      groupTypes: [],
      mailEnabled: false,
      mailNickname: '',
      securityEnabled: true,
      owners: [],
      members: [],
    },
  });

  const watchGroupTypes = watch('groupTypes');
  const watchMailEnabled = watch('mailEnabled');
  const watchDisplayName = watch('displayName');

  useEffect(() => {
    if (group && mode === 'edit') {
      reset({
        displayName: group.displayName,
        description: group.description || '',
        groupTypes: group.groupTypes,
        mailEnabled: group.mailEnabled,
        mailNickname: group.mailNickname,
        securityEnabled: group.securityEnabled,
        owners: [],
        members: [],
      });
    } else {
      reset({
        displayName: '',
        description: '',
        groupTypes: [],
        mailEnabled: false,
        mailNickname: '',
        securityEnabled: true,
        owners: [],
        members: [],
      });
    }
  }, [group, mode, reset]);

  // Auto-generate mail nickname from display name
  useEffect(() => {
    if (isCreate && watchDisplayName && watchMailEnabled) {
      const nickname = watchDisplayName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 64);
      // This would ideally use setValue, but we'll handle it in the form
    }
  }, [watchDisplayName, watchMailEnabled, isCreate]);

  const onSubmit = async (data: CreateGroupRequest) => {
    try {
      if (isCreate) {
        await createGroup(data).unwrap();
        dispatch(addNotification({
          type: 'success',
          title: 'Group Created',
          message: `${data.displayName} has been created successfully.`,
        }));
      } else if (group) {
        await updateGroup({ 
          id: group.id, 
          data: {
            displayName: data.displayName,
            description: data.description,
            // Note: Some properties like groupTypes and mail settings cannot be modified after creation
          }
        }).unwrap();
        dispatch(addNotification({
          type: 'success',
          title: 'Group Updated',
          message: `${data.displayName} has been updated successfully.`,
        }));
      }
      onClose();
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        title: isCreate ? 'Creation Failed' : 'Update Failed',
        message: error?.data?.message || `Failed to ${isCreate ? 'create' : 'update'} group.`,
      }));
    }
  };

  const isUnifiedGroup = watchGroupTypes.includes('Unified');

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{ sx: { minHeight: '70vh' } }}
    >
      <DialogTitle>
        {isCreate ? 'Create New Group' : `Edit ${group?.displayName}`}
      </DialogTitle>
      
      <DialogContent>
        <Box component="form" sx={{ marginTop: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Controller
                name="displayName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Group Name *"
                    error={!!errors.displayName}
                    helperText={errors.displayName?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Description"
                    multiline
                    rows={3}
                    placeholder="Describe the purpose of this group..."
                  />
                )}
              />
            </Grid>

            {isCreate && (
              <>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Group Type
                  </Typography>
                  <Controller
                    name="groupTypes"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Group Type</InputLabel>
                        <Select
                          {...field}
                          multiple
                          label="Group Type"
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {(selected as string[]).map((value) => (
                                <Chip 
                                  key={value} 
                                  label={value === 'Unified' ? 'Microsoft 365 Group' : value} 
                                  size="small" 
                                />
                              ))}
                            </Box>
                          )}
                        >
                          <MenuItem value="Unified">Microsoft 365 Group</MenuItem>
                        </Select>
                        <FormHelperText>
                          Microsoft 365 groups include Teams, SharePoint sites, and shared mailboxes
                        </FormHelperText>
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="mailEnabled"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Switch {...field} checked={field.value} />}
                        label="Mail Enabled"
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="securityEnabled"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Switch {...field} checked={field.value} />}
                        label="Security Enabled"
                      />
                    )}
                  />
                </Grid>

                {watchMailEnabled && (
                  <Grid item xs={12}>
                    <Controller
                      name="mailNickname"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Mail Nickname *"
                          error={!!errors.mailNickname}
                          helperText={errors.mailNickname?.message || 'Used for email addresses and SharePoint URLs'}
                          placeholder={watchDisplayName?.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 64)}
                        />
                      )}
                    />
                  </Grid>
                )}

                {isUnifiedGroup && (
                  <Grid item xs={12}>
                    <Alert severity="info">
                      Microsoft 365 groups automatically include a shared mailbox, SharePoint site, 
                      and can be used with Microsoft Teams.
                    </Alert>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Initial Owners (Optional)
                  </Typography>
                  <Controller
                    name="owners"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Owners</InputLabel>
                        <Select
                          {...field}
                          multiple
                          label="Owners"
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {(selected as string[]).map((value) => {
                                const user = usersData?.users?.find(u => u.id === value);
                                return (
                                  <Chip 
                                    key={value} 
                                    label={user?.displayName || value} 
                                    size="small" 
                                  />
                                );
                              })}
                            </Box>
                          )}
                        >
                          {usersData?.users?.map((user) => (
                            <MenuItem key={user.id} value={user.id}>
                              {user.displayName} ({user.userPrincipalName})
                            </MenuItem>
                          ))}
                        </Select>
                        <FormHelperText>
                          Group owners can manage membership and settings
                        </FormHelperText>
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Initial Members (Optional)
                  </Typography>
                  <Controller
                    name="members"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Members</InputLabel>
                        <Select
                          {...field}
                          multiple
                          label="Members"
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {(selected as string[]).map((value) => {
                                const user = usersData?.users?.find(u => u.id === value);
                                return (
                                  <Chip 
                                    key={value} 
                                    label={user?.displayName || value} 
                                    size="small" 
                                  />
                                );
                              })}
                            </Box>
                          )}
                        >
                          {usersData?.users?.map((user) => (
                            <MenuItem key={user.id} value={user.id}>
                              {user.displayName} ({user.userPrincipalName})
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
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          disabled={isCreating || isUpdating}
        >
          {isCreating || isUpdating ? 'Saving...' : (isCreate ? 'Create Group' : 'Update Group')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GroupForm;