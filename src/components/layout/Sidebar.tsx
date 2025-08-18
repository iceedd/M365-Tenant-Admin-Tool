import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Box,
  Collapse,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Group as GroupIcon,
  License as LicenseIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
  PersonAdd as PersonAddIcon,
  GroupAdd as GroupAddIcon,
  Analytics as AnalyticsIcon,
  Security as SecurityIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { setSidebarOpen } from '../../store/slices/uiSlice';
import { NavItem } from '../../types';

const DRAWER_WIDTH = 280;

interface SidebarItemProps {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
  level?: number;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ 
  item, 
  isActive, 
  onClick, 
  level = 0 
}) => {
  const [open, setOpen] = React.useState(false);
  const hasChildren = item.children && item.children.length > 0;

  const handleClick = () => {
    if (hasChildren) {
      setOpen(!open);
    } else {
      onClick();
    }
  };

  return (
    <>
      <ListItem disablePadding>
        <ListItemButton
          onClick={handleClick}
          selected={isActive && !hasChildren}
          sx={{
            paddingLeft: 2 + level * 2,
            '&.Mui-selected': {
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
              '& .MuiListItemIcon-root': {
                color: 'primary.contrastText',
              },
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            {item.icon}
          </ListItemIcon>
          <ListItemText primary={item.label} />
          {hasChildren && (open ? <ExpandLess /> : <ExpandMore />)}
        </ListItemButton>
      </ListItem>
      
      {hasChildren && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {item.children?.map((childItem) => (
              <SidebarItem
                key={childItem.path}
                item={childItem}
                isActive={isActive}
                onClick={onClick}
                level={level + 1}
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
};

const Sidebar: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { sidebarOpen } = useSelector((state: RootState) => state.ui);

  const navigationItems: NavItem[] = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: <DashboardIcon />,
    },
    {
      label: 'Users',
      path: '/users',
      icon: <PeopleIcon />,
      children: [
        {
          label: 'All Users',
          path: '/users',
          icon: <PeopleIcon />,
        },
        {
          label: 'Add User',
          path: '/users/create',
          icon: <PersonAddIcon />,
        },
      ],
    },
    {
      label: 'Groups',
      path: '/groups',
      icon: <GroupIcon />,
      children: [
        {
          label: 'All Groups',
          path: '/groups',
          icon: <GroupIcon />,
        },
        {
          label: 'Create Group',
          path: '/groups/create',
          icon: <GroupAddIcon />,
        },
      ],
    },
    {
      label: 'Licenses',
      path: '/licenses',
      icon: <LicenseIcon />,
    },
    {
      label: 'Reports',
      path: '/reports',
      icon: <AnalyticsIcon />,
      children: [
        {
          label: 'User Reports',
          path: '/reports/users',
          icon: <PeopleIcon />,
        },
        {
          label: 'License Reports',
          path: '/reports/licenses',
          icon: <LicenseIcon />,
        },
        {
          label: 'Security Reports',
          path: '/reports/security',
          icon: <SecurityIcon />,
        },
      ],
    },
  ];

  const adminItems: NavItem[] = [
    {
      label: 'Administration',
      path: '/admin',
      icon: <AdminIcon />,
      children: [
        {
          label: 'Settings',
          path: '/admin/settings',
          icon: <SettingsIcon />,
        },
        {
          label: 'Security',
          path: '/admin/security',
          icon: <SecurityIcon />,
        },
      ],
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      dispatch(setSidebarOpen(false));
    }
  };

  const handleDrawerClose = () => {
    dispatch(setSidebarOpen(false));
  };

  const isPathActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar />
      
      <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
        <List>
          {navigationItems.map((item) => (
            <SidebarItem
              key={item.path}
              item={item}
              isActive={isPathActive(item.path)}
              onClick={() => handleNavigation(item.path)}
            />
          ))}
        </List>
        
        <Divider sx={{ marginY: 1 }} />
        
        <List>
          {adminItems.map((item) => (
            <SidebarItem
              key={item.path}
              item={item}
              isActive={isPathActive(item.path)}
              onClick={() => handleNavigation(item.path)}
            />
          ))}
        </List>
      </Box>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={sidebarOpen}
        onClose={handleDrawerClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: DRAWER_WIDTH,
            backgroundColor: 'background.paper',
            borderRight: 1,
            borderColor: 'divider',
          },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Desktop drawer */}
      <Drawer
        variant="persistent"
        open={sidebarOpen}
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: DRAWER_WIDTH,
            backgroundColor: 'background.paper',
            borderRight: 1,
            borderColor: 'divider',
          },
        }}
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar;