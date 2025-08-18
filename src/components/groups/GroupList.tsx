import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Group as GroupIcon,
  Security as SecurityIcon,
  Email as EmailIcon,
  Download as ExportIcon,
} from '@mui/icons-material';
import { GridColDef } from '@mui/x-data-grid';
import DataTable from '../common/DataTable';
import { useGetGroupsQuery, useDeleteGroupMutation } from '../../store/api/groupsApi';
import { useDispatch } from 'react-redux';
import { addNotification } from '../../store/slices/notificationSlice';
import { Group } from '../../types';

interface GroupListProps {
  onCreateGroup: () => void;
  onEditGroup: (group: Group) => void;
  onViewGroup: (group: Group) => void;
}

const GroupList: React.FC<GroupListProps> = ({
  onCreateGroup,
  onEditGroup,
  onViewGroup,
}) => {
  const dispatch = useDispatch();
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; group: Group | null }>({
    open: false,
    group: null,
  });

  const { data: groupsData, isLoading, error } = useGetGroupsQuery({
    pagination: { page, pageSize },
  });

  const [deleteGroup] = useDeleteGroupMutation();

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteClick = (group: Group) => {
    setDeleteDialog({ open: true, group });
  };

  const handleDeleteConfirm = async () => {
    if (deleteDialog.group) {
      try {
        await deleteGroup(deleteDialog.group.id).unwrap();
        dispatch(addNotification({
          type: 'success',
          title: 'Group Deleted',
          message: `${deleteDialog.group.displayName} has been deleted successfully.`,
        }));
      } catch (error: any) {
        dispatch(addNotification({
          type: 'error',
          title: 'Delete Failed',
          message: error?.data?.message || 'Failed to delete group.',
        }));
      }
    }
    setDeleteDialog({ open: false, group: null });
  };

  const handleExport = async (format: 'csv' | 'xlsx') => {
    // Export functionality would be implemented similar to users
    dispatch(addNotification({
      type: 'info',
      title: 'Export',
      message: 'Group export functionality will be available soon.',
    }));
    handleMenuClose();
  };

  const columns: GridColDef[] = [
    {
      field: 'displayName',
      headerName: 'Group Name',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GroupIcon color="primary" />
          <Typography>{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 1,
      minWidth: 250,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value || 'No description'}
        </Typography>
      ),
    },
    {
      field: 'groupTypes',
      headerName: 'Type',
      width: 120,
      renderCell: (params) => {
        const isUnified = params.value?.includes('Unified');
        return (
          <Chip
            label={isUnified ? 'Microsoft 365' : 'Security'}
            color={isUnified ? 'primary' : 'default'}
            size="small"
            icon={isUnified ? <EmailIcon /> : <SecurityIcon />}
          />
        );
      },
    },
    {
      field: 'mailEnabled',
      headerName: 'Mail Enabled',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Yes' : 'No'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'securityEnabled',
      headerName: 'Security Enabled',
      width: 140,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Yes' : 'No'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'memberCount',
      headerName: 'Members',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value || 0}
          color="primary"
          size="small"
        />
      ),
    },
    {
      field: 'ownerCount',
      headerName: 'Owners',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value || 0}
          color="secondary"
          size="small"
        />
      ),
    },
    {
      field: 'createdDateTime',
      headerName: 'Created',
      width: 120,
      renderCell: (params) => 
        new Date(params.value).toLocaleDateString(),
    },
  ];

  if (error) {
    return (
      <Alert severity="error">
        Failed to load groups. Please try again.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 3 
      }}>
        <Typography variant="h4" component="h1">
          Groups
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={handleMenuClick}>
            <MoreVertIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => handleExport('csv')}>
              <ExportIcon sx={{ marginRight: 1 }} />
              Export as CSV
            </MenuItem>
            <MenuItem onClick={() => handleExport('xlsx')}>
              <ExportIcon sx={{ marginRight: 1 }} />
              Export as Excel
            </MenuItem>
          </Menu>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreateGroup}
          >
            Create Group
          </Button>
        </Box>
      </Box>

      <DataTable
        columns={columns}
        rows={groupsData?.groups || []}
        loading={isLoading}
        onEdit={onEditGroup}
        onDelete={handleDeleteClick}
        onView={onViewGroup}
        pageSize={pageSize}
      />

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, group: null })}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete "{deleteDialog.group?.displayName}"? 
          This action cannot be undone and will remove all members from the group.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, group: null })}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GroupList;