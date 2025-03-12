
// frontend/src/config.js
// Application configuration

// API URL based on environment
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

// Default date format
export const DATE_FORMAT = 'YYYY-MM-DD';

// Default time format
export const TIME_FORMAT = 'HH:mm:ss';

// Default datetime format
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

// Max idle time in minutes before auto logout (30 minutes)
export const MAX_IDLE_TIME = 30;

// Theme configuration
export const THEME_CONFIG = {
  primary: '#1976d2', // Blue
  secondary: '#dc004e', // Pink
  success: '#4caf50', // Green
  warning: '#ff9800', // Orange
  error: '#f44336', // Red
  info: '#2196f3', // Light Blue
};