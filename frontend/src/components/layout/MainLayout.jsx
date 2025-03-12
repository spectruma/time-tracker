// frontend/src/components/layout/MainLayout.jsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Box, CssBaseline, Toolbar, Snackbar, Alert } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { clearError, clearSuccessMessage } from '../../store/slices/uiSlice';
import TopBar from './TopBar';
import SideNav from './SideNav';
import RefreshTokenHandler from '../auth/RefreshTokenHandler';
import IdleTimer from '../utils/IdleTimer';

// Main layout component that wraps all authenticated pages
const MainLayout = () => {
  const dispatch = useDispatch();
  const { darkMode, error, successMessage } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Drawer width
  const drawerWidth = 240;
  
  // Create theme based on darkMode preference
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
      background: {
        default: darkMode ? '#121212' : '#f5f5f5',
      },
    },
    components: {
      MuiListItemButton: {
        styleOverrides: {
          root: {
            '&.Mui-selected': {
              backgroundColor: darkMode ? 'rgba(25, 118, 210, 0.2)' : 'rgba(25, 118, 210, 0.1)',
              '&:hover': {
                backgroundColor: darkMode ? 'rgba(25, 118, 210, 0.3)' : 'rgba(25, 118, 210, 0.2)',
              },
            },
          },
        },
      },
    },
  });
  
  // Handle sidebar toggle
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  // Handle error snackbar close
  const handleErrorClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    dispatch(clearError());
  };
  
  // Handle success snackbar close
  const handleSuccessClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    dispatch(clearSuccessMessage());
  };
  
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex', height: '100vh' }}>
        <CssBaseline />
        
        {/* Top navigation bar */}
        <TopBar 
          drawerWidth={drawerWidth} 
          sidebarOpen={sidebarOpen} 
          toggleSidebar={toggleSidebar} 
        />
        
        {/* Side navigation */}
        <SideNav 
          drawerWidth={drawerWidth} 
          open={sidebarOpen} 
          isAdmin={user?.role === 'admin'} 
        />
        
        {/* Main content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - ${sidebarOpen ? drawerWidth : 0}px)` },
            ml: { sm: sidebarOpen ? `${drawerWidth}px` : 0 },
            transition: theme.transitions.create(['margin', 'width'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
            overflowY: 'auto',
          }}
        >
          <Toolbar /> {/* Add space for the app bar */}
          <Outlet /> {/* Render the nested routes */}
        </Box>
        
        {/* Error notification */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={handleErrorClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleErrorClose} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
        
        {/* Success notification */}
        <Snackbar
          open={!!successMessage}
          autoHideDuration={4000}
          onClose={handleSuccessClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleSuccessClose} severity="success" sx={{ width: '100%' }}>
            {successMessage}
          </Alert>
        </Snackbar>
        
        {/* Background handlers */}
        <RefreshTokenHandler />
        <IdleTimer />
      </Box>
    </ThemeProvider>
  );
};

export default MainLayout;
