import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Chip,
  Avatar,
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
  Person as PersonIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Download as ExportIcon,
} from '@mui/icons-material';
import { GridColDef } from '@mui/x-data-grid';
import DataTable from '../common/DataTable';
import UserFilters from './UserFilters';
import { useGetUsersQuery, useDeleteUserMutation, useExportUsersMutation } from '../../store/api/usersApi';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { setSelectedUsers } from '../../store/slices/uiSlice';
import { addNotification } from '../../store/slices/notificationSlice';
import { User } from '../../types';

interface UserListProps {
  onCreateUser: () => void;
  onEditUser: (user: User) => void;
  onViewUser: (user: User) => void;
}

const UserList: React.FC<UserListProps> = ({
  onCreateUser,
  onEditUser,
  onViewUser,
}) => {
  const dispatch = useDispatch();
  const { searchFilters, selectedUsers } = useSelector((state: RootState) => state.ui);
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: User | null }>({
    open: false,
    user: null,
  });

  const { data: usersData, isLoading, error } = useGetUsersQuery({
    filters: searchFilters,
    pagination: { page, pageSize },
  });

  const [deleteUser] = useDeleteUserMutation();
  const [exportUsers] = useExportUsersMutation();

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteClick = (user: User) => {
    setDeleteDialog({ open: true, user });
  };

  const handleDeleteConfirm = async () => {
    if (deleteDialog.user) {
      try {
        await deleteUser(deleteDialog.user.id).unwrap();
        dispatch(addNotification({
          type: 'success',
          title: 'User Deleted',
          message: `${deleteDialog.user.displayName} has been deleted successfully.`,
        }));
      } catch (error: any) {
        dispatch(addNotification({
          type: 'error',
          title: 'Delete Failed',
          message: error?.data?.message || 'Failed to delete user.',
        }));
      }
    }
    setDeleteDialog({ open: false, user: null });
  };

  const handleExport = async (format: 'csv' | 'xlsx') => {
    try {
      const blob = await exportUsers({ filters: searchFilters, format }).unwrap();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      dispatch(addNotification({
        type: 'success',
        title: 'Export Complete',
        message: `Users exported successfully as ${format.toUpperCase()}.`,
      }));
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        title: 'Export Failed',
        message: error?.data?.message || 'Failed to export users.',
      }));
    }
    handleMenuClose();
  };

  const columns: GridColDef[] = [
    {
      field: 'avatar',
      headerName: '',
      width: 60,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Avatar sx={{ width: 32, height: 32 }}>
          <PersonIcon />
        </Avatar>
      ),
    },
    {
      field: 'displayName',
      headerName: 'Display Name',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'userPrincipalName',
      headerName: 'Email',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'jobTitle',
      headerName: 'Job Title',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'department',
      headerName: 'Department',
      flex: 1,
      minWidth: 120,
    },
    {
      field: 'accountEnabled',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip
          icon={params.value ? <ActiveIcon /> : <InactiveIcon />}
          label={params.value ? 'Active' : 'Inactive'}
          color={params.value ? 'success' : 'error'}
          size="small"
        />
      ),
    },
    {
      field: 'assignedLicenses',
      headerName: 'Licenses',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value?.length || 0}
          color="primary"
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

  const handleSelectionChange = (selection: string[]) => {
    dispatch(setSelectedUsers(selection));
  };

  if (error) {
    return (
      <Alert severity="error">
        Failed to load users. Please try again.
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
          Users
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
            onClick={onCreateUser}
          >
            Add User
          </Button>
        </Box>
      </Box>

      <UserFilters />

      {selectedUsers.length > 0 && (
        <Box sx={{ marginY: 2 }}>
          <Alert severity="info">
            {selectedUsers.length} user(s) selected. 
            <Button size="small" sx={{ marginLeft: 1 }}>
              Bulk Actions
            </Button>
          </Alert>
        </Box>
      )}

      <DataTable
        columns={columns}
        rows={usersData?.users || []}
        loading={isLoading}
        onEdit={onEditUser}
        onDelete={handleDeleteClick}
        onView={onViewUser}
        checkboxSelection
        onSelectionChange={handleSelectionChange}
        pageSize={pageSize}
      />

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, user: null })}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete {deleteDialog.user?.displayName}? 
          This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, user: null })}>
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

export default UserList;