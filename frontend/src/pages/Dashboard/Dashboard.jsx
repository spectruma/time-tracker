// frontend/src/pages/Dashboard/Dashboard.jsx
import React, { useState } from 'react';
import { useGetDashboardDataQuery } from '../../store/services/analyticsApi';
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Button,
  Stack,
  Divider,
  TextField,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { 
  AccessTime as TimeIcon,
  EventNote as LeaveIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import DashboardHeader from './DashboardHeader';
import TimeBalanceCard from './TimeBalanceCard';
import LeaveBalanceCard from './LeaveBalanceCard';
import TimeTrackerCard from './TimeTrackerCard';
import WorkingHoursChart from './WorkingHoursChart';
import OvertimeWidget from './OvertimeWidget';
import format from 'date-fns/format';
import startOfMonth from 'date-fns/startOfMonth';
import endOfMonth from 'date-fns/endOfMonth';

const Dashboard = () => {
  // State for date filter
  const [dateRange, setDateRange] = useState({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date()),
  });

  // Format dates for API
  const formattedStartDate = format(dateRange.startDate, 'yyyy-MM-dd');
  const formattedEndDate = format(dateRange.endDate, 'yyyy-MM-dd');

  // Fetch dashboard data
  const { data, error, isLoading, refetch } = useGetDashboardDataQuery({
    startDate: formattedStartDate,
    endDate: formattedEndDate,
  });

  // Handle date change
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

  // Handle refresh
  const handleRefresh = () => {
    refetch();
  };

  return (
    <Box>
      <DashboardHeader 
        title="Dashboard" 
        subtitle="Overview of your time and leave balances"
      />

      {/* Date filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <Typography variant="body1" sx={{ minWidth: 100 }}>
            Date Range:
          </Typography>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Start Date"
              value={dateRange.startDate}
              onChange={handleStartDateChange}
              renderInput={(params) => <TextField {...params} size="small" />}
            />
            <DatePicker
              label="End Date"
              value={dateRange.endDate}
              onChange={handleEndDateChange}
              renderInput={(params) => <TextField {...params} size="small" />}
            />
          </LocalizationProvider>
          <Button
            variant="contained"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            Apply
          </Button>
        </Stack>
      </Paper>

      {/* Loading state */}
      {isLoading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}

      {/* Error state */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Error loading dashboard data. Please try again.
        </Alert>
      )}

      {/* Dashboard content */}
      {data && !isLoading && (
        <Grid container spacing={3}>
          {/* Summary cards row */}
          <Grid item xs={12} md={4}>
            <TimeBalanceCard 
              totalHours={data.time_balance.total_hours} 
              overtimeHours={data.time_balance.overtime_hours}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <LeaveBalanceCard 
              leaveBalance={data.leave_balance} 
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TimeTrackerCard />
          </Grid>

          {/* Charts row */}
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Working Hours
              </Typography>
              <WorkingHoursChart 
                dailyHours={data.time_balance.daily_hours} 
              />
            </Paper>
          </Grid>
          <Grid item xs={12} lg={4}>
            <OvertimeWidget 
              overtimeHours={data.time_balance.overtime_hours}
              period={{
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
              }}
            />
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Dashboard;

