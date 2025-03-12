// frontend/src/components/layout/SideNav.jsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  Toolbar,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Timer as TimerIcon,
  EventNote as CalendarIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  History as HistoryIcon,
  SupervisorAccount as AdminIcon,
} from '@mui/icons-material';

// Side navigation component
const SideNav = ({ drawerWidth, open, isAdmin }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation items
  const mainNavItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
    },
    {
      text: 'Time Tracking',
      icon: <TimerIcon />,
      path: '/time-tracking',
    },
    {
      text: 'Leave Management',
      icon: <CalendarIcon />,
      path: '/leave',
    },
    {
      text: 'History',
      icon: <HistoryIcon />,
      path: '/history',
    },
    {
      text: 'Reports',
      icon: <ReportsIcon />,
      path: '/reports',
    },
  ];
  
  // Admin navigation items
  const adminNavItems = [
    {
      text: 'User Management',
      icon: <PeopleIcon />,
      path: '/admin/users',
    },
    {
      text: 'Admin Dashboard',
      icon: <AdminIcon />,
      path: '/admin/dashboard',
    },
    {
      text: 'Settings',
      icon: <SettingsIcon />,
      path: '/admin/settings',
    },
  ];

  // Handle navigation item click
  const handleNavItemClick = (path) => {
    navigate(path);
  };

  // Drawer content
  const drawerContent = (
    <>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
          Time Tracker
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {mainNavItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavItemClick(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      {isAdmin && (
        <>
          <Divider />
          <Box px={2} py={1}>
            <Typography variant="overline" color="textSecondary">
              Administration
            </Typography>
          </Box>
          <List>
            {adminNavItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => handleNavItemClick(item.path)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </>
      )}
    </>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
    >
      {/* Mobile drawer (temporary) */}
      <Drawer
        variant="temporary"
        open={open}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
      >
        {drawerContent}
      </Drawer>
      
      {/* Desktop drawer (persistent) */}
      <Drawer
        variant="persistent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
        open={open}
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default SideNav;
