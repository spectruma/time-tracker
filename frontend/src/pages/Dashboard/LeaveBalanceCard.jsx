// frontend/src/pages/Dashboard/LeaveBalanceCard.jsx
import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Stack, 
  Divider, 
  LinearProgress 
} from '@mui/material';
import { EventNote as LeaveIcon } from '@mui/icons-material';

const LeaveBalanceCard = ({ leaveBalance }) => {
  // Assuming a standard allocation of leave days
  const vacationAllocation = 25;
  const sickLeaveAllocation = 10;
  const specialPermitAllocation = 5;

  // Calculate percentages for progress bars
  const vacationUsedPercent = (leaveBalance.vacation / vacationAllocation) * 100;
  const sickLeaveUsedPercent = (leaveBalance.sick_leave / sickLeaveAllocation) * 100;
  const specialPermitUsedPercent = (leaveBalance.special_permit / specialPermitAllocation) * 100;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack spacing={2}>
          <Box display="flex" alignItems="center">
            <LeaveIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Leave Balance</Typography>
          </Box>

          <Box>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="body2" color="text.secondary">
                Vacation
              </Typography>
              <Typography variant="body2">
                {leaveBalance.vacation} / {vacationAllocation} days
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={vacationUsedPercent} 
              color="primary" 
            />
          </Box>

          <Box>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="body2" color="text.secondary">
                Sick Leave
              </Typography>
              <Typography variant="body2">
                {leaveBalance.sick_leave} / {sickLeaveAllocation} days
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={sickLeaveUsedPercent} 
              color="error" 
            />
          </Box>

          <Box>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="body2" color="text.secondary">
                Special Permit
              </Typography>
              <Typography variant="body2">
                {leaveBalance.special_permit} / {specialPermitAllocation} days
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={specialPermitUsedPercent} 
              color="warning" 
            />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default LeaveBalanceCard;
