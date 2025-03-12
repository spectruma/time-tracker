// frontend/src/pages/Admin/AdminDashboard.jsx
import React from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Divider,
  Button,
  CircularProgress,
} from '@mui/material';
import { 
  PeopleAlt as UsersIcon,
  EventAvailable as ApprovedIcon,
  EventBusy as PendingIcon,
  Warning as WarningIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import DashboardHeader from '../Dashboard/DashboardHeader';
import { 
  useGetPendingTimeEntriesQuery,
  useGetPendingLeaveRequestsQuery,
} from '../../store/services/timeEntriesApi';
import { useCheckWorkingTimeComplianceQuery } from '../../store/services/analyticsApi';
import { useGetUsersQuery } from '../../store/services/usersApi';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  // RTK Query hooks
  const { data: pendingTimeEntries, isLoading: isLoadingTimeEntries } = useGetPendingTimeEntriesQuery({});
  const { data: pendingLeaveRequests, isLoading: isLoadingLeaveRequests } = useGetPendingLeaveRequestsQuery({});
  const { data: complianceData, isLoading: isLoadingCompliance } = useCheckWorkingTimeComplianceQuery({});
  const { data: users, isLoading: isLoadingUsers } = useGetUsersQuery({});
  
  // Count active/inactive users
  const activeUsers = users ? users.filter(user => user.is_active).length : 0;
  const inactiveUsers = users ? users.length - activeUsers : 0;
  
  // Navigate to pages
  const goToUserManagement = () => {
    navigate('/admin/users');
  };
  
  const goToTimeEntries = () => {
    navigate('/time-tracking');
  };
  
  const goToLeaveRequests = () => {
    navigate('/leave');
  };
  
  return (
    <Box>
      <DashboardHeader 
        title="Admin Dashboard" 
        subtitle="Overview of system status and pending approvals"
      />
      
      <Grid container spacing={3}>
        {/* Stats Cards Row */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <UsersIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Users</Typography>
              </Box>
              {isLoadingUsers ? (
                <CircularProgress size={24} />
              ) : (
                <>
                  <Typography variant="h3">{users?.length || 0}</Typography>
                  <Box mt={1}>
                    <Typography variant="body2" color="text.secondary">
                      {activeUsers} active, {inactiveUsers} inactive
                    </Typography>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TimeIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Pending Entries</Typography>
              </Box>
              {isLoadingTimeEntries ? (
                <CircularProgress size={24} />
              ) : (
                <>
                  <Typography variant="h3">{pendingTimeEntries?.length || 0}</Typography>
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    Time entries requiring approval
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EventAvailable color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Leave Requests</Typography>
              </Box>
              {isLoadingLeaveRequests ? (
                <CircularProgress size={24} />
              ) : (
                <>
                  <Typography variant="h3">{pendingLeaveRequests?.length || 0}</Typography>
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    Pending leave approvals
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <WarningIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Compliance</Typography>
              </Box>
              {isLoadingCompliance ? (
                <CircularProgress size={24} />
              ) : (
                <>
                  <Typography variant="h3" color={complianceData?.overall_compliance ? 'success.main' : 'error.main'}>
                    {complianceData?.overall_compliance ? 'OK' : 'Issues'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    EU Working Time Directive
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Main Content Row */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Pending Approvals
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Typography variant="subtitle2" gutterBottom>
              Time Entries
            </Typography>
            {isLoadingTimeEntries ? (
              <CircularProgress size={24} />
            ) : pendingTimeEntries?.length === 0 ? (
              <Typography variant="body2" color="text.secondary" mb={2}>
                No pending time entries to approve.
              </Typography>
            ) : (
              <>
                <List dense>
                  {pendingTimeEntries?.slice(0, 5).map((entry) => (
                    <ListItem key={entry.id}>
                      <ListItemIcon>
                        <PendingIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={`${entry.user_email || 'User'}`}
                        secondary={`${new Date(entry.start_time).toLocaleDateString()} (${entry.description || 'No description'})`}
                      />
                    </ListItem>
                  ))}
                </List>
                {pendingTimeEntries?.length > 5 && (
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    +{pendingTimeEntries.length - 5} more entries
                  </Typography>
                )}
              </>
            )}
            
            <Button 
              variant="outlined" 
              fullWidth 
              sx={{ mt: 2 }}
              onClick={goToTimeEntries}
            >
              Manage Time Entries
            </Button>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="subtitle2" gutterBottom>
              Leave Requests
            </Typography>
            {isLoadingLeaveRequests ? (
              <CircularProgress size={24} />
            ) : pendingLeaveRequests?.length === 0 ? (
              <Typography variant="body2" color="text.secondary" mb={2}>
                No pending leave requests to approve.
              </Typography>
            ) : (
              <>
                <List dense>
                  {pendingLeaveRequests?.slice(0, 5).map((request) => (
                    <ListItem key={request.id}>
                      <ListItemIcon>
                        <PendingIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={`${request.user_email || 'User'} - ${request.leave_type}`}
                        secondary={`${new Date(request.start_date).toLocaleDateString()} to ${new Date(request.end_date).toLocaleDateString()}`}
                      />
                    </ListItem>
                  ))}
                </List>
                {pendingLeaveRequests?.length > 5 && (
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    +{pendingLeaveRequests.length - 5} more requests
                  </Typography>
                )}
              </>
            )}
            
            <Button 
              variant="outlined" 
              fullWidth 
              sx={{ mt: 2 }}
              onClick={goToLeaveRequests}
            >
              Manage Leave Requests
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Compliance Overview
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {isLoadingCompliance ? (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
              </Box>
            ) : !complianceData ? (
              <Typography variant="body2" color="text.secondary">
                No compliance data available.
              </Typography>
            ) : (
              <>
                <Box 
                  sx={{ 
                    p: 2, 
                    mb: 3, 
                    bgcolor: complianceData.overall_compliance ? 'success.light' : 'error.light',
                    borderRadius: 1,
                    color: complianceData.overall_compliance ? 'success.dark' : 'error.dark',
                  }}
                >
                  <Typography variant="h6">
                    {complianceData.overall_compliance ? 'Compliant' : 'Non-Compliant'}
                  </Typography>
                  <Typography variant="body2">
                    EU Working Time Directive Status
                  </Typography>
                </Box>
                
                <Typography variant="subtitle2" gutterBottom>
                  Users with Compliance Issues:
                </Typography>
                
                {complianceData.results.filter(r => !r.is_compliant).length === 0 ? (
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    All users are compliant.
                  </Typography>
                ) : (
                  <List dense>
                    {complianceData.results
                      .filter(r => !r.is_compliant)
                      .slice(0, 5)
                      .map((user, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <WarningIcon color="error" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={user.user_email}
                            secondary={`Rest violations: ${user.rest_period_violations}, Weekly hour violations: ${user.weekly_hour_violations}`}
                          />
                        </ListItem>
                      ))
                    }
                  </List>
                )}
                
                <Divider sx={{ my: 3 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  Quick Actions
                </Typography>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  sx={{ mb: 2 }}
                  onClick={goToUserManagement}
                >
                  User Management
                </Button>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;

