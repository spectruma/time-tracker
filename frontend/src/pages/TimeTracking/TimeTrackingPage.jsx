// frontend/src/pages/TimeTracking/TimeTrackingPage.jsx
import React, { useState } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Button, 
  TextField, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  Divider,
  Tab,
  Tabs,
} from '@mui/material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
} from '@mui/icons-material';
import DashboardHeader from '../Dashboard/DashboardHeader';
import TimeEntriesTable from './TimeEntriesTable';
import TimeTracker from './TimeTracker';
import { 
  useGetTimeEntriesQuery,
  useCreateTimeEntryMutation,
  useUpdateTimeEntryMutation,
  useDeleteTimeEntryMutation,
} from '../../store/services/timeEntriesApi';
import { format, parse, startOfDay, endOfDay, subDays, addDays } from 'date-fns';

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`time-tracking-tabpanel-${index}`}
      aria-labelledby={`time-tracking-tab-${index}`}
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

const TimeTrackingPage = () => {
  // State for tabs
  const [tabValue, setTabValue] = useState(0);
  
  // State for date range
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 7),
    endDate: new Date(),
  });
  
  // State for time entry dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date(),
    startTime: new Date(),
    endTime: new Date(new Date().getTime() + 60 * 60 * 1000), // 1 hour later
    description: '',
    isManualEntry: true,
  });
  
  // Format dates for API
  const formattedStartDate = format(dateRange.startDate, 'yyyy-MM-dd');
  const formattedEndDate = format(dateRange.endDate, 'yyyy-MM-dd');
  
  // RTK Query hooks
  const { 
    data: timeEntries, 
    isLoading, 
    error,
    refetch,
  } = useGetTimeEntriesQuery({
    startDate: formattedStartDate,
    endDate: formattedEndDate,
  });
  
  const [createTimeEntry, { isLoading: isCreating }] = useCreateTimeEntryMutation();
  const [updateTimeEntry, { isLoading: isUpdating }] = useUpdateTimeEntryMutation();
  const [deleteTimeEntry, { isLoading: isDeleting }] = useDeleteTimeEntryMutation();
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Handle date range change
  const handleStartDateChange = (newDate) => {
    setDateRange((prev) => ({
      ...prev,
      startDate: newDate,
    }));
  };
  
  const handleEndDateChange = (newDate) => {
    setDateRange((prev) => ({
      ...prev,
      endDate: newDate,
    }));
  };
  
  // Handle dialog open/close
  const handleOpenDialog = (entry = null) => {
    if (entry) {
      // Editing existing entry
      setEditingEntry(entry);
      const entryDate = new Date(entry.start_time);
      setFormData({
        date: entryDate,
        startTime: new Date(entry.start_time),
        endTime: entry.end_time ? new Date(entry.end_time) : null,
        description: entry.description || '',
        isManualEntry: entry.is_manual_entry,
      });
    } else {
      // Creating new entry
      setEditingEntry(null);
      setFormData({
        date: new Date(),
        startTime: new Date(),
        endTime: new Date(new Date().getTime() + 60 * 60 * 1000),
        description: '',
        isManualEntry: true,
      });
    }
    setDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingEntry(null);
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };
  
  const handleDateChange = (date) => {
    setFormData((prev) => ({
      ...prev,
      date,
    }));
  };
  
  const handleStartTimeChange = (time) => {
    setFormData((prev) => ({
      ...prev,
      startTime: time,
    }));
  };
  
  const handleEndTimeChange = (time) => {
    setFormData((prev) => ({
      ...prev,
      endTime: time,
    }));
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    try {
      // Combine date and time
      const combinedStartTime = new Date(formData.date);
      combinedStartTime.setHours(
        formData.startTime.getHours(),
        formData.startTime.getMinutes(),
        0
      );
      
      const combinedEndTime = formData.endTime ? new Date(formData.date) : null;
      if (combinedEndTime) {
        combinedEndTime.setHours(
          formData.endTime.getHours(),
          formData.endTime.getMinutes(),
          0
        );
      }
      
      // Basic validation
      if (combinedEndTime && combinedStartTime >= combinedEndTime) {
        alert('End time must be after start time');
        return;
      }
      
      const timeEntryData = {
        start_time: combinedStartTime.toISOString(),
        end_time: combinedEndTime ? combinedEndTime.toISOString() : null,
        description: formData.description,
        is_manual_entry: formData.isManualEntry,
      };
      
      if (editingEntry) {
        // Update existing entry
        await updateTimeEntry({
          id: editingEntry.id,
          ...timeEntryData,
        }).unwrap();
      } else {
        // Create new entry
        await createTimeEntry(timeEntryData).unwrap();
      }
      
      // Close dialog and refresh data
      handleCloseDialog();
      refetch();
    } catch (error) {
      console.error('Error submitting time entry:', error);
      alert('An error occurred. Please try again.');
    }
  };
  
  // Handle entry deletion
  const handleDeleteEntry = async (id) => {
    if (window.confirm('Are you sure you want to delete this time entry?')) {
      try {
        await deleteTimeEntry(id).unwrap();
        refetch();
      } catch (error) {
        console.error('Error deleting time entry:', error);
        alert('An error occurred. Please try again.');
      }
    }
  };
  
  return (
    <Box>
      <DashboardHeader 
        title="Time Tracking" 
        subtitle="Track and manage your working hours"
      />
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Time Entries" />
          <Tab label="Live Tracker" />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Your Time Entries</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add Entry
            </Button>
          </Box>
          
          <Box mb={3}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={5} md={4}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="From"
                    value={dateRange.startDate}
                    onChange={handleStartDateChange}
                    renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={5} md={4}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="To"
                    value={dateRange.endDate}
                    onChange={handleEndDateChange}
                    renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={2} md={4}>
                <Button
                  variant="outlined"
                  onClick={refetch}
                  disabled={isLoading}
                  fullWidth
                >
                  Apply
                </Button>
              </Grid>
            </Grid>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              Error loading time entries. Please try again.
            </Alert>
          )}
          
          <TimeEntriesTable 
            entries={timeEntries || []}
            isLoading={isLoading}
            onEdit={handleOpenDialog}
            onDelete={handleDeleteEntry}
          />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <TimeTracker onEntryCreated={refetch} />
        </TabPanel>
      </Paper>
      
      {/* Time Entry Form Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingEntry ? 'Edit Time Entry' : 'Add Time Entry'}
        </DialogTitle>
        <DialogContent>
          <Box py={1}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Date"
                    value={formData.date}
                    onChange={handleDateChange}
                    renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <TimePicker
                    label="Start Time"
                    value={formData.startTime}
                    onChange={handleStartTimeChange}
                    renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <TimePicker
                    label="End Time"
                    value={formData.endTime}
                    onChange={handleEndTimeChange}
                    renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Description"
                  value={formData.description}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={2}
                  margin="normal"
                  placeholder="What were you working on?"
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
            {isCreating || isUpdating ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TimeTrackingPage;
