import React, { useState } from 'react';
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
  Box,
  Typography,
  Grid,
  Alert
} from '@mui/material';
import {
  Security,
  Email,
  GroupWork,
  Shield
} from '@mui/icons-material';

interface GroupCreationFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (groupData: any) => void;
}

const GroupCreationFormSimple: React.FC<GroupCreationFormProps> = ({ open, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    displayName: '',
    description: '',
    groupType: 'Security',
    mailNickname: '',
    visibility: 'Private'
  });

  const [isCreating, setIsCreating] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.displayName || !formData.groupType) {
      alert('Please fill in required fields');
      return;
    }

    setIsCreating(true);
    try {
      // Simulate group creation
      await new Promise(resolve => setTimeout(resolve, 1000));
      onSubmit(formData);
      handleClose();
    } catch (error) {
      console.error('Error creating group:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setFormData({
      displayName: '',
      description: '',
      groupType: 'Security',
      mailNickname: '',
      visibility: 'Private'
    });
    onClose();
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

  const isMailEnabled = formData.groupType === 'Distribution' || 
                       formData.groupType === 'Microsoft365' || 
                       formData.groupType === 'Mail-Enabled Security';

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h5">Create New Group</Typography>
        <Typography variant="body2" color="text.secondary">
          Create a new security or distribution group
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Group Name"
              value={formData.displayName}
              onChange={(e) => handleChange('displayName', e.target.value)}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe the purpose of this group..."
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>Group Type</InputLabel>
              <Select
                value={formData.groupType}
                onChange={(e) => handleChange('groupType', e.target.value)}
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
            </FormControl>
          </Grid>

          {isMailEnabled && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Mail Nickname"
                value={formData.mailNickname}
                onChange={(e) => handleChange('mailNickname', e.target.value)}
                helperText={`Email will be: ${formData.mailNickname || 'nickname'}@contoso.com`}
                required
              />
            </Grid>
          )}

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Visibility</InputLabel>
              <Select
                value={formData.visibility}
                onChange={(e) => handleChange('visibility', e.target.value)}
                label="Visibility"
              >
                <MenuItem value="Public">Public</MenuItem>
                <MenuItem value="Private">Private</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Alert severity="info">
              <Typography variant="body2">
                <strong>{formData.groupType}:</strong> {
                  formData.groupType === 'Security' ? 'Used to manage access to resources and assign permissions.' :
                  formData.groupType === 'Distribution' ? 'Used for email distribution to multiple recipients.' :
                  formData.groupType === 'Microsoft365' ? 'Provides collaboration workspace with Teams and SharePoint.' :
                  'Combines security group functionality with email distribution.'
                }
              </Typography>
            </Alert>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isCreating}>
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          disabled={isCreating || !formData.displayName || (isMailEnabled && !formData.mailNickname)}
        >
          {isCreating ? 'Creating...' : 'Create Group'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GroupCreationFormSimple;