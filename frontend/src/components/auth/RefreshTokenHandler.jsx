// frontend/src/components/auth/RefreshTokenHandler.jsx
import { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRefreshTokenMutation } from '../../store/services/authApi';
import { logout } from '../../store/slices/authSlice';

/**
 * Component to handle JWT token refresh
 * This component doesn't render anything, it just handles token refresh in the background
 */
const RefreshTokenHandler = () => {
  const { tokens } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  
  // RTK Query hooks
  const [refreshToken, { isLoading }] = useRefreshTokenMutation();
  
  // Function to decode JWT and get expiration time
  const getTokenExpiration = useCallback((token) => {
    if (!token) return null;
    
    try {
      // Decode the JWT payload
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000; // Convert to milliseconds
    } catch (error) {
      console.error('Invalid token format', error);
      return null;
    }
  }, []);
  
  // Function to refresh the token
  const handleRefreshToken = useCallback(async () => {
    if (!tokens?.refreshToken) {
      return;
    }
    
    try {
      await refreshToken({ refresh_token: tokens.refreshToken }).unwrap();
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, log out the user
      dispatch(logout());
    }
  }, [tokens, refreshToken, dispatch]);
  
  // Set up token refresh mechanism
  useEffect(() => {
    if (!tokens?.accessToken) return;
    
    // Get token expiration time
    const expirationTime = getTokenExpiration(tokens.accessToken);
    if (!expirationTime) {
      dispatch(logout());
      return;
    }
    
    // Calculate time until token expiration (with 5-minute buffer)
    const currentTime = Date.now();
    const timeUntilExpiry = expirationTime - currentTime - 5 * 60 * 1000; // 5 minutes before expiry
    
    if (timeUntilExpiry <= 0) {
      // Token already expired or about to expire, refresh immediately
      handleRefreshToken();
      return;
    }
    
    // Set timer to refresh token before it expires
    const refreshTimer = setTimeout(handleRefreshToken, timeUntilExpiry);
    
    // Clean up timer on component unmount
    return () => clearTimeout(refreshTimer);
  }, [tokens, getTokenExpiration, handleRefreshToken, dispatch]);
  
  // This component doesn't render anything
  return null;
};

export default RefreshTokenHandler;