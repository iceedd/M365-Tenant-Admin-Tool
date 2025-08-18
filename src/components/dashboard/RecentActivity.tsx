import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Chip,
  Box,
  Alert,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  License as LicenseIcon,
} from '@mui/icons-material';
import { useGetRecentActivitiesQuery } from '../../store/api/dashboardApi';
import { Activity } from '../../types';

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'user_created':
      return <PersonAddIcon />;
    case 'user_updated':
      return <EditIcon />;
    case 'user_deleted':
      return <DeleteIcon />;
    case 'group_created':
      return <GroupIcon />;
    case 'license_assigned':
      return <LicenseIcon />;
    default:
      return <EditIcon />;
  }
};

const getActivityColor = (type: Activity['type']): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  switch (type) {
    case 'user_created':
      return 'success';
    case 'user_updated':
      return 'info';
    case 'user_deleted':
      return 'error';
    case 'group_created':
      return 'primary';
    case 'license_assigned':
      return 'secondary';
    default:
      return 'default';
  }
};

const formatActivityType = (type: Activity['type']) => {
  switch (type) {
    case 'user_created':
      return 'User Created';
    case 'user_updated':
      return 'User Updated';
    case 'user_deleted':
      return 'User Deleted';
    case 'group_created':
      return 'Group Created';
    case 'license_assigned':
      return 'License Assigned';
    default:
      return 'Activity';
  }
};

const formatTimeAgo = (dateString: string) => {
  const now = new Date();
  const activityDate = new Date(dateString);
  const diffMs = now.getTime() - activityDate.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return diffMinutes > 0 ? `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago` : 'Just now';
  }
};

interface RecentActivityProps {
  limit?: number;
}

const RecentActivity: React.FC<RecentActivityProps> = ({ limit = 10 }) => {
  const { data: activities = [], isLoading, error } = useGetRecentActivitiesQuery({ limit });

  if (error) {
    return (
      <Card>
        <CardHeader title="Recent Activity" />
        <CardContent>
          <Alert severity="error">
            Failed to load recent activities.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader 
        title="Recent Activity" 
        subheader={`Last ${activities.length} activities`}
      />
      <CardContent sx={{ paddingTop: 0 }}>
        {isLoading ? (
          <Typography>Loading activities...</Typography>
        ) : activities.length === 0 ? (
          <Alert severity="info">
            No recent activities to display.
          </Alert>
        ) : (
          <List sx={{ padding: 0 }}>
            {activities.map((activity, index) => (
              <ListItem
                key={activity.id}
                sx={{
                  paddingX: 0,
                  ...(index !== activities.length - 1 && {
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }),
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      backgroundColor: `${getActivityColor(activity.type)}.main`,
                      width: 40,
                      height: 40,
                    }}
                  >
                    {getActivityIcon(activity.type)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: 0.5 }}>
                      <Typography variant="body2">
                        {activity.description}
                      </Typography>
                      <Chip
                        label={formatActivityType(activity.type)}
                        size="small"
                        color={getActivityColor(activity.type)}
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        {activity.userName && `by ${activity.userName}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTimeAgo(activity.timestamp)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;