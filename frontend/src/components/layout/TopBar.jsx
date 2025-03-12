// frontend/src/components/layout/TopBar.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  AccountCircle,
  Notifications,
  PlayArrow,
  Stop,
} from '@mui/icons-material';
import { logout } from '../../store/slices/authSlice';
import { toggleDarkMode } from '../../store/slices/uiSlice';
import { useCreateTimeEntryMutation } from '../../store/services/timeEntriesApi';

// Top navigation bar component
const TopBar = ({ drawerWidth, sidebarOpen, toggleSidebar }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { darkMode } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);
  
  // User menu state
  const [anchorElUser, setAnchorElUser] = useState(null);
  
  // Time tracking state
  const [tracking, setTracking] = useState(false);
  
  // Get user's first initial and last name for avatar
  const getInitials = () => {
    if (!user || !user.full_name) return '?';
    
    const nameParts = user.full_name.split(' ');
    if (nameParts.length === 1) return nameParts[0].charAt(0);
    
    return `${nameParts[0].charAt(0)}${nameParts[nameParts.length - 1].charAt(0)}`;
  };
  
  // RTK Query hooks
  const [createTimeEntry, { isLoading: isCreatingTimeEntry }] = useCreateTimeEntryMutation();
  
  // Handle user menu open
  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };
  
  // Handle user menu close
  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };
  
  // Handle logout
  const handleLogout = () => {
    handleCloseUserMenu();
    dispatch(logout());
    navigate('/login');
  };
  
  // Handle profile navigation
  const handleProfile = () => {
    handleCloseUserMenu();
    navigate('/profile');
  };
  
  // Handle dark mode toggle
  const handleDarkModeToggle = () => {
    dispatch(toggleDarkMode());
  };
  
  // Handle time tracking toggle
  const handleTrackingToggle = async () => {
    if (tracking) {
      // Stop tracking (this would be handled by updating the time entry in a real app)
      setTracking(false);
    } else {
      try {
        // Create a new time entry with start time
        await createTimeEntry({
          start_time: new Date().toISOString(),
          is_manual_entry: false,
        }).unwrap();
        
        setTracking(true);
      } catch (error) {
        console.error('Failed to start time tracking:', error);
      }
    }
  };
  
  return (
    <AppBar
      position="fixed"
      sx={{
        width: { sm: sidebarOpen ? `calc(100% - ${drawerWidth}px)` : '100%' },
        ml: { sm: sidebarOpen ? `${drawerWidth}px` : 0 },
        transition: (theme) =>
          theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
      }}
    >
      <Toolbar>
        {/* Sidebar toggle button */}
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={toggleSidebar}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        
        {/* App title */}
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}
        >
          Time Tracker
        </Typography>
        
        {/* Time tracking button */}
        <Tooltip title={tracking ? 'Stop tracking' : 'Start tracking'}>
          <Button
            color="inherit"
            startIcon={tracking ? <Stop /> : <PlayArrow />}
            onClick={handleTrackingToggle}
            disabled={isCreatingTimeEntry}
            sx={{ mr: 2 }}
          >
            {tracking ? 'Stop' : 'Start'}
          </Button>
        </Tooltip>
        
        {/* Dark mode toggle */}
        <Tooltip title={darkMode ? 'Light mode' : 'Dark mode'}>
          <IconButton
            color="inherit"
            onClick={handleDarkModeToggle}
            sx={{ mr: 1 }}
          >
            {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Tooltip>
        
        {/* Notifications button */}
        <Tooltip title="Notifications">
          <IconButton color="inherit" sx={{ mr: 1 }}>
            <Notifications />
          </IconButton>
        </Tooltip>
        
        {/* User menu */}
        <Box sx={{ flexGrow: 0 }}>
          <Tooltip title="Open settings">
            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                {getInitials()}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu
            sx={{ mt: '45px' }}
            id="menu-appbar"
            anchorEl={anchorElUser}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorElUser)}
            onClose={handleCloseUserMenu}
          >
            <MenuItem disabled>
              <Typography variant="body2" color="textSecondary">
                {user?.email}
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleProfile}>Profile</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar;
