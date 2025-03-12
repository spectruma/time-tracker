// frontend/src/pages/LeaveManagement/LeaveManagementPage.jsx
import React, { useState } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Button, 
  TextField, 
  Tab, 
  Tabs, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { 
  Add as AddIcon,
  EventNote as EventIcon,
} from '@mui/icons-material';
import DashboardHeader from '../Dashboard/DashboardHeader';
import LeaveRequestsTable from './LeaveRequestsTable';
import LeaveCalendar from './LeaveCalendar';
import LeaveBalanceCard from '../Dashboard/LeaveBalanceCard';
import {
  useGetLeaveRequestsQuery,
  useCreateLeaveRequestMutation,
  useUpdateLeaveRequestMutation,
  useDeleteLeaveRequestMutation,
} from '../../store/services/leaveRequestsApi';
import { useGetDashboardDataQuery } from '../../store/services/analyticsApi';
import { format, differenceInCalendarDays, addDays } from 'date-fns';

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`leave-tabpanel-${index}`}
      aria-labelledby={`leave-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const LeaveManagementPage = () => {
  // State for tabs
  const [tabValue, setTabValue] = useState(0);
  
  // State for leave request dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [formData, setFormData] = useState({
    leaveType: 'vacation',
    startDate: addDays(new Date(), 1),
    endDate: addDays(new Date(), 5),
    reason: '',
  });
  
  // State for filter
  const [statusFilter, setStatusFilter] = useState('');
  
  // RTK Query hooks
  const { 
    data: leaveRequests, 
    isLoading, 
    error,
    refetch,
  } = useGetLeaveRequestsQuery({
    status: statusFilter || undefined,
  });
  
  const { data: dashboardData } = useGetDashboardDataQuery({});
  
  const [createLeaveRequest, { isLoading: isCreating }] = useCreateLeaveRequestMutation();
  const [updateLeaveRequest, { isLoading: isUpdating }] = useUpdateLeaveRequestMutation();
  const [deleteLeaveRequest, { isLoading: isDeleting }] = useDeleteLeaveRequestMutation();
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Handle dialog open/close
  const handleOpenDialog = (request = null) => {
    if (request) {
      // Editing existing request
      setEditingRequest(request);
      setFormData({
        leaveType: request.leave_type,
        startDate: new Date(request.start_date),
        endDate: new Date(request.end_date),
        reason: request.reason || '',
      });
    } else {
      // Creating new request
      setEditingRequest(null);
      setFormData({
        leaveType: 'vacation',
        startDate: addDays(new Date(), 1),
        endDate: addDays(new Date(), 5),
        reason: '',
      });
    }
    setDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingRequest(null);
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleStartDateChange = (date) => {
    setFormData((prev) => ({
      ...prev,
      startDate: date,
      // If end date is before new start date, update it
      endDate: prev.endDate < date ? date : prev.endDate,
    }));
  };
  
  const handleEndDateChange = (date) => {
    setFormData((prev) => ({
      ...prev,
      endDate: date,
    }));
  };
  
  // Calculate the number of days in the request
  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    
    // Add 1 to include both start and end dates
    return differenceInCalendarDays(formData.endDate, formData.startDate) + 1;
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    try {
      // Basic validation
      if (formData.startDate > formData.endDate) {
        alert('End date must be after start date');
        return;
      }
      
      const leaveRequestData = {
        leave_type: formData.leaveType,
        start_date: format(formData.startDate, 'yyyy-MM-dd'),
        end_date: format(formData.endDate, 'yyyy-MM-dd'),
        reason: formData.reason.trim() || null,
      };
      
      if (editingRequest) {
        // Update existing request
        await updateLeaveRequest({
          id: editingRequest.id,
          ...leaveRequestData,
        }).unwrap();
      } else {
        // Create new request
        await createLeaveRequest(leaveRequestData).unwrap();
      }
      
      // Close dialog and refresh data
      handleCloseDialog();
      refetch();
    } catch (error) {
      console.error('Error submitting leave request:', error);
      alert(error.data?.detail || 'An error occurred. Please try again.');
    }
  };
  
  // Handle request deletion
  const handleDeleteRequest = async (id) => {
    if (window.confirm('Are you sure you want to cancel this leave request?')) {
      try {
        await deleteLeaveRequest(id).unwrap();
        refetch();
      } catch (error) {
        console.error('Error deleting leave request:', error);
        alert('An error occurred. Please try again.');
      }
    }
  };
  
  // Handle status filter change
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };
  
  return (
    <Box>
      <DashboardHeader 
        title="Leave Management" 
        subtitle="Request and manage your time off"
      />
      
      {dashboardData && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <LeaveBalanceCard leaveBalance={dashboardData.leave_balance} />
          </Grid>
        </Grid>
      )}
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Requests" />
          <Tab label="Calendar" />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Your Leave Requests</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              New Request
            </Button>
          </Box>
          
          <Box mb={3}>
            <TextField
              select
              label="Filter by Status"
              value={statusFilter}
              onChange={handleStatusFilterChange}
              variant="outlined"
              size="small"
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">All Requests</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
              <MenuItem value="canceled">Canceled</MenuItem>
            </TextField>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              Error loading leave requests. Please try again.
            </Alert>
          )}
          
          <LeaveRequestsTable 
            requests={leaveRequests || []}
            isLoading={isLoading}
            onEdit={handleOpenDialog}
            onDelete={handleDeleteRequest}
          />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <LeaveCalendar requests={leaveRequests || []} />
        </TabPanel>
      </Paper>
      
      {/* Leave Request Form Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingRequest ? 'Edit Leave Request' : 'New Leave Request'}
        </DialogTitle>
        <DialogContent>
          <Box py={1}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  select
                  name="leaveType"
                  label="Leave Type"
                  value={formData.leaveType}
                  onChange={handleInputChange}
                  fullWidth
                  margin="normal"
                >
                  <MenuItem value="vacation">Vacation</MenuItem>
                  <MenuItem value="sick_leave">Sick Leave</MenuItem>
                  <MenuItem value="special_permit">Special Permit</MenuItem>
                </TextField>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={formData.startDate}
                    onChange={handleStartDateChange}
                    renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
                    minDate={new Date()}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="End Date"
                    value={formData.endDate}
                    onChange={handleEndDateChange}
                    renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
                    minDate={formData.startDate}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12}>
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    Duration: {calculateDays()} day(s)
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="reason"
                  label="Reason (Optional)"
                  value={formData.reason}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={3}
                  margin="normal"
                  placeholder="Explain the reason for your leave request"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            color="primary" 
            variant="contained"
            disabled={isCreating || isUpdating}
          >
            {isCreating || isUpdating ? 'Saving...' : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LeaveManagementPage;
