// frontend/src/pages/LeaveManagement/LeaveRequestsTable.jsx
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
  Cancel as RejectedIcon,
  HourglassEmpty as PendingIcon,
  Block as CanceledIcon,
} from '@mui/icons-material';
import { format, parseISO, differenceInDays } from 'date-fns';

const LeaveRequestsTable = ({ requests, isLoading, onEdit, onDelete }) => {
  // Format date
  const formatDate = (dateString) => {
    return format(parseISO(dateString), 'MMM dd, yyyy');
  };
  
  // Calculate duration in days
  const calculateDuration = (startDate, endDate) => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    return differenceInDays(end, start) + 1; // +1 to include both start and end days
  };
  
  // Get status chip
  const getStatusChip = (status) => {
    switch (status) {
      case 'approved':
        return (
          <Chip 
            icon={<ApprovedIcon />} 
            label="Approved" 
            color="success" 
            size="small" 
            variant="outlined" 
          />
        );
      case 'rejected':
        return (
          <Chip 
            icon={<RejectedIcon />} 
            label="Rejected" 
            color="error" 
            size="small" 
            variant="outlined" 
          />
        );
      case 'canceled':
        return (
          <Chip 
            icon={<CanceledIcon />} 
            label="Canceled" 
            color="default" 
            size="small" 
            variant="outlined" 
          />
        );
      case 'pending':
      default:
        return (
          <Chip 
            icon={<PendingIcon />} 
            label="Pending" 
            color="warning" 
            size="small" 
            variant="outlined" 
          />
        );
    }
  };
  
  // Get type label
  const getTypeLabel = (type) => {
    switch (type) {
      case 'vacation':
        return 'Vacation';
      case 'sick_leave':
        return 'Sick Leave';
      case 'special_permit':
        return 'Special Permit';
      default:
        return type;
    }
  };
  
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (requests.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="body1" color="text.secondary">
          No leave requests found.
        </Typography>
      </Box>
    );
  }
  
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Type</TableCell>
            <TableCell>Dates</TableCell>
            <TableCell>Duration</TableCell>
            <TableCell>Reason</TableCell>
            <TableCell align="center">Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>{getTypeLabel(request.leave_type)}</TableCell>
              <TableCell>
                {formatDate(request.start_date)} - {formatDate(request.end_date)}
              </TableCell>
              <TableCell>
                {calculateDuration(request.start_date, request.end_date)} day(s)
              </TableCell>
              <TableCell>
                {request.reason || <Typography variant="body2" color="text.secondary">No reason provided</Typography>}
              </TableCell>
              <TableCell align="center">
                {getStatusChip(request.status)}
              </TableCell>
              <TableCell align="right">
                {request.status === 'pending' && (
                  <>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => onEdit(request)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Cancel">
                      <IconButton size="small" onClick={() => onDelete(request.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default LeaveRequestsTable;
