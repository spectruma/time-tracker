// frontend/src/pages/TimeTracking/TimeEntriesTable.jsx
import React from 'react';
import { 
  Box, 
  Table, 
  TableContainer, 
  TableHead, 
  TableBody, 
  TableRow, 
  TableCell,
  Paper,
  IconButton, 
  Chip,
  Typography, 
  CircularProgress,
  Tooltip,
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  CheckCircle as ApprovedIcon,
  HourglassEmpty as PendingIcon,
} from '@mui/icons-material';
import { format, parseISO, differenceInMinutes, differenceInSeconds } from 'date-fns';

const TimeEntriesTable = ({ entries, isLoading, onEdit, onDelete }) => {
  // Format date and time
  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    return format(parseISO(dateString), 'MMM dd, yyyy HH:mm');
  };
  
  // Format time only
  const formatTime = (dateString) => {
    if (!dateString) return '—';
    return format(parseISO(dateString), 'HH:mm');
  };
  
  // Calculate duration between start and end time
  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return '—';
    
    const start = parseISO(startTime);
    const end = parseISO(endTime);
    
    const minutes = differenceInMinutes(end, start);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    return `${hours}h ${remainingMinutes}m`;
  };
  
  // Group entries by date
  const groupedEntries = entries.reduce((acc, entry) => {
    const date = format(parseISO(entry.start_time), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(entry);
    return acc;
  }, {});
  
  // Sort dates in descending order
  const sortedDates = Object.keys(groupedEntries).sort((a, b) => 
    new Date(b) - new Date(a)
  );
  
  // Calculate total hours per day
  const calculateDailyTotal = (entries) => {
    let totalSeconds = 0;
    
    entries.forEach(entry => {
      if (entry.start_time && entry.end_time) {
        totalSeconds += differenceInSeconds(
          parseISO(entry.end_time),
          parseISO(entry.start_time)
        );
      }
    });
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    return `${hours}h ${minutes}m`;
  };
  
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (entries.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="body1" color="text.secondary">
          No time entries found for the selected period.
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box>
      {sortedDates.map(date => (
        <Box key={date} mb={4}>
          <Box 
            display="flex" 
            justifyContent="space-between" 
            alignItems="center"
            mb={1}
          >
            <Typography variant="h6">
              {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
            </Typography>
            <Typography variant="subtitle1">
              Total: {calculateDailyTotal(groupedEntries[date])}
            </Typography>
          </Box>
          
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Start</TableCell>
                  <TableCell>End</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {groupedEntries[date].map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{formatTime(entry.start_time)}</TableCell>
                    <TableCell>{formatTime(entry.end_time)}</TableCell>
                    <TableCell>{calculateDuration(entry.start_time, entry.end_time)}</TableCell>
                    <TableCell>
                      {entry.description || <Typography variant="body2" color="text.secondary">No description</Typography>}
                    </TableCell>
                    <TableCell align="center">
                      {entry.is_manual_entry ? (
                        entry.is_approved ? (
                          <Chip 
                            icon={<ApprovedIcon />} 
                            label="Approved" 
                            size="small" 
                            color="success" 
                            variant="outlined" 
                          />
                        ) : (
                          <Chip 
                            icon={<PendingIcon />} 
                            label="Pending" 
                            size="small" 
                            color="warning" 
                            variant="outlined" 
                          />
                        )
                      ) : (
                        <Chip 
                          label="Automatic" 
                          size="small" 
                          color="primary" 
                          variant="outlined" 
                        />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => onEdit(entry)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => onDelete(entry.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ))}
    </Box>
  );
};

export default TimeEntriesTable;
