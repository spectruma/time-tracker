// frontend/src/components/auth/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, CircularProgress } from '@mui/material';

// Component for protected routes
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const location = useLocation();
  
  // Check if user is authenticated
  if (!isAuthenticated) {
    // Redirect to login page with return URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Check if route requires admin privileges
  if (requireAdmin && user?.role !== 'admin') {
    // Redirect to unauthorized page
    return <Navigate to="/unauthorized" replace />;
  }
  
  // If user is authenticated and has required permissions, render the route
  return children;
};

export default ProtectedRoute;
