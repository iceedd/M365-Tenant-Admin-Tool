import React, { useState } from 'react';
import { Box } from '@mui/material';
import GroupList from '../components/groups/GroupList';
import GroupForm from '../components/groups/GroupForm';
import { Group } from '../types';

const Groups: React.FC = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  const handleCreateGroup = () => {
    setSelectedGroup(null);
    setFormMode('create');
    setFormOpen(true);
  };

  const handleEditGroup = (group: Group) => {
    setSelectedGroup(group);
    setFormMode('edit');
    setFormOpen(true);
  };

  const handleViewGroup = (group: Group) => {
    // For now, view opens edit form
    // In the future, this could open a dedicated group detail view
    handleEditGroup(group);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setSelectedGroup(null);
  };

  return (
    <Box>
      <GroupList
        onCreateGroup={handleCreateGroup}
        onEditGroup={handleEditGroup}
        onViewGroup={handleViewGroup}
      />

      <GroupForm
        open={formOpen}
        onClose={handleCloseForm}
        group={selectedGroup}
        mode={formMode}
      />
    </Box>
  );
};

export default Groups;