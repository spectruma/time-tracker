// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { CssBaseline } from '@mui/material';
import store from './store';

// Layouts
import MainLayout from './components/layout/MainLayout';

// Authentication components
import LoginPage from './pages/Auth/LoginPage';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import Dashboard from './pages/Dashboard/Dashboard';
import TimeTrackingPage from './pages/TimeTracking/TimeTrackingPage';
import LeaveManagementPage from './pages/LeaveManagement/LeaveManagementPage';
import ProfilePage from './pages/Profile/ProfilePage';
import HistoryPage from './pages/History/HistoryPage';
import ReportsPage from './pages/Reports/ReportsPage';
import NotFoundPage from './pages/NotFound/NotFoundPage';
import UnauthorizedPage from './pages/Unauthorized/UnauthorizedPage';

// Admin pages
import AdminDashboard from './pages/Admin/AdminDashboard';
import UserManagement from './pages/Admin/UserManagement';
import AdminSettings from './pages/Admin/AdminSettings';

const App = () => {
  return (
    <Provider store={store}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <CssBaseline />
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            
            {/* Protected routes with MainLayout */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="time-tracking" element={<TimeTrackingPage />} />
              <Route path="leave" element={<LeaveManagementPage />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              
              {/* Admin routes */}
              <Route 
                path="admin/dashboard" 
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="admin/users" 
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <UserManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="admin/settings" 
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminSettings />
                  </ProtectedRoute>
                } 
              />
            </Route>
            
            {/* Not found route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </LocalizationProvider>
    </Provider>
  );
};

export default App;
