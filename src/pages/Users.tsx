import React, { useState } from 'react';
import { Box } from '@mui/material';
import UserList from '../components/users/UserList';
import UserForm from '../components/users/UserForm';
import UserDetail from '../components/users/UserDetail';
import { User } from '../types';

const Users: React.FC = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  const handleCreateUser = () => {
    setSelectedUser(null);
    setFormMode('create');
    setFormOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormMode('edit');
    setFormOpen(true);
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setDetailOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setSelectedUser(null);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedUser(null);
  };

  const handleEditFromDetail = (user: User) => {
    setDetailOpen(false);
    handleEditUser(user);
  };

  return (
    <Box>
      <UserList
        onCreateUser={handleCreateUser}
        onEditUser={handleEditUser}
        onViewUser={handleViewUser}
      />

      <UserForm
        open={formOpen}
        onClose={handleCloseForm}
        user={selectedUser}
        mode={formMode}
      />

      <UserDetail
        open={detailOpen}
        onClose={handleCloseDetail}
        userId={selectedUser?.id || null}
        onEdit={handleEditFromDetail}
      />
    </Box>
  );
};

export default Users;