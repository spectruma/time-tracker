// frontend/src/pages/Dashboard/TimeBalanceCard.jsx
import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Stack, 
  Divider 
} from '@mui/material';
import { AccessTime as TimeIcon } from '@mui/icons-material';

const TimeBalanceCard = ({ totalHours, overtimeHours }) => {
  // Format hours to display hours and minutes
  const formatHours = (hours) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack spacing={2}>
          <Box display="flex" alignItems="center">
            <TimeIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Time Balance</Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              Total Hours
            </Typography>
            <Typography variant="h4">
              {formatHours(totalHours)}
            </Typography>
          </Box>

          <Divider />

          <Box>
            <Typography variant="body2" color="text.secondary">
              Overtime
            </Typography>
            <Typography 
              variant="h5" 
              color={overtimeHours > 0 ? 'success.main' : 'text.primary'}
            >
              {formatHours(overtimeHours)}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default TimeBalanceCard;
