// frontend/src/pages/LeaveManagement/LeaveCalendar.jsx
import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Grid, 
  Typography, 
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  ArrowBack as PrevIcon,
  ArrowForward as NextIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isWeekend,
  parseISO,
} from 'date-fns';

const LeaveCalendar = ({ requests = [] }) => {
  // State for current month
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Get days in month
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });
  
  // Get day of week for the first day of month (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfMonth = startOfMonth(currentMonth).getDay();
  
  // Get days from previous month to fill first row
  const daysFromPrevMonth = firstDayOfMonth;
  
  // Navigate to previous/next month
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  // Check if a date has leave requests
  const getLeaveRequestsForDate = (date) => {
    return requests.filter(request => {
      const startDate = parseISO(request.start_date);
      const endDate = parseISO(request.end_date);
      
      return date >= startDate && date <= endDate;
    });
  };
  
  // Get color for leave type
  const getLeaveTypeColor = (type) => {
    switch (type) {
      case 'vacation':
        return 'primary';
      case 'sick_leave':
        return 'error';
      case 'special_permit':
        return 'warning';
      default:
        return 'default';
    }
  };
  
  // Generate day cells
  const renderDays = () => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return (
      <Grid container>
        {dayNames.map((day, index) => (
          <Grid item xs key={index} sx={{ textAlign: 'center', p: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              {day}
            </Typography>
          </Grid>
        ))}
      </Grid>
    );
  };
  
  // Generate calendar grid
  const renderCells = () => {
    const rows = [];
    let days = [];
    
    // Add empty cells for days from previous month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <Grid item xs key={`empty-${i}`}>
          <Box 
            sx={{ 
              p: 1, 
              height: 80, 
              bgcolor: 'background.default',
              borderRadius: 1,
              opacity: 0.5,
            }}
          />
        </Grid>
      );
    }
    
    // Add cells for days in current month
    daysInMonth.forEach((day, index) => {
      const dateString = format(day, 'yyyy-MM-dd');
      const isToday = isSameDay(day, new Date());
      const isWeekendDay = isWeekend(day);
      const leaveRequests = getLeaveRequestsForDate(day);
      const hasLeave = leaveRequests.length > 0;
      
      days.push(
        <Grid item xs key={dateString}>
          <Box 
            sx={{ 
              p: 1, 
              height: 80, 
              border: isToday ? 2 : 0,
              borderColor: 'primary.main',
              borderRadius: 1,
              bgcolor: isWeekendDay ? 'background.default' : 'background.paper',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}
          >
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: isToday ? 'bold' : 'normal',
                color: isToday ? 'primary.main' : 'text.primary',
              }}
            >
              {format(day, 'd')}
            </Typography>
            
            {hasLeave && (
              <Box sx={{ mt: 'auto', display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {leaveRequests.map((request, idx) => (
                  <Tooltip
                    key={`${request.id}-${idx}`}
                    title={`${format(parseISO(request.start_date), 'MMM d')} - ${format(parseISO(request.end_date), 'MMM d')}: ${request.status}`}
                  >
                    <Chip
                      size="small"
                      label={request.leave_type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      color={getLeaveTypeColor(request.leave_type)}
                      variant="outlined"
                      sx={{ 
                        height: 20, 
                        '& .MuiChip-label': { 
                          px: 0.5,
                          fontSize: '0.625rem',
                        },
                      }}
                    />
                  </Tooltip>
                ))}
              </Box>
            )}
          </Box>
        </Grid>
      );
      
      // Create a new row when we reach the end of a week
      if ((index + firstDayOfMonth + 1) % 7 === 0 || index === daysInMonth.length - 1) {
        rows.push(
          <Grid container spacing={1} key={index}>
            {days}
          </Grid>
        );
        days = [];
      }
    });
    
    return rows;
  };
  
  return (
    <Box>
      <Box 
        display="flex" 
        alignItems="center" 
        justifyContent="space-between" 
        mb={3}
      >
        <Typography variant="h6">
          {format(currentMonth, 'MMMM yyyy')}
        </Typography>
        <Box>
          <IconButton onClick={prevMonth}>
            <PrevIcon />
          </IconButton>
          <IconButton onClick={() => setCurrentMonth(new Date())}>
            <EventIcon />
          </IconButton>
          <IconButton onClick={nextMonth}>
            <NextIcon />
          </IconButton>
        </Box>
      </Box>
      
      <Paper variant="outlined" sx={{ p: 2 }}>
        {renderDays()}
        <Box mt={1} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {renderCells()}
        </Box>
      </Paper>
      
      <Box mt={3}>
        <Typography variant="subtitle2" gutterBottom>
          Legend:
        </Typography>
        <Box display="flex" gap={2}>
          <Chip size="small" label="Vacation" color="primary" variant="outlined" />
          <Chip size="small" label="Sick Leave" color="error" variant="outlined" />
          <Chip size="small" label="Special Permit" color="warning" variant="outlined" />
        </Box>
      </Box>
    </Box>
  );
};

export default LeaveCalendar;
