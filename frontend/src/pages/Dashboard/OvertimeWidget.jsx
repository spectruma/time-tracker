// frontend/src/pages/Dashboard/OvertimeWidget.jsx
import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Stack,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { 
  TimerOff as OvertimeIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon, 
  Info as InfoIcon
} from '@mui/icons-material';
import format from 'date-fns/format';

const OvertimeWidget = ({ overtimeHours, period }) => {
  // Format hours to display hours and minutes
  const formatHours = (hours) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };
  
  // Format period dates
  const formattedStartDate = format(period.startDate, 'MMM dd, yyyy');
  const formattedEndDate = format(period.endDate, 'MMM dd, yyyy');
  
  // Determine overtime status and messages
  const getOvertimeStatus = () => {
    if (overtimeHours <= 0) {
      return {
        severity: 'info',
        icon: <InfoIcon color="info" />,
        message: 'No overtime accumulated in this period.',
      };
    } else if (overtimeHours < 10) {
      return {
        severity: 'success',
        icon: <CheckIcon color="success" />,
        message: 'Healthy overtime balance.',
      };
    } else {
      return {
        severity: 'warning',
        icon: <WarningIcon color="warning" />,
        message: 'High overtime accumulation. Consider taking time off.',
      };
    }
  };
  
  const overtimeStatus = getOvertimeStatus();
  
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack spacing={2}>
          <Box display="flex" alignItems="center">
            <OvertimeIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Overtime Analysis</Typography>
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary">
              Period
            </Typography>
            <Typography variant="body1">
              {formattedStartDate} - {formattedEndDate}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary">
              Accumulated Overtime
            </Typography>
            <Typography 
              variant="h4" 
              color={overtimeHours > 0 ? 'success.main' : 'text.primary'}
            >
              {formatHours(overtimeHours)}
            </Typography>
          </Box>
          
          <Divider />
          
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Status
            </Typography>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                p: 1,
                borderRadius: 1,
                bgcolor: `${overtimeStatus.severity}.light`,
                color: `${overtimeStatus.severity}.dark`,
              }}
            >
              {overtimeStatus.icon}
              <Typography variant="body2">
                {overtimeStatus.message}
              </Typography>
            </Box>
          </Box>
          
          <Divider />
          
          <List dense disablePadding>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <InfoIcon fontSize="small" color="info" />
              </ListItemIcon>
              <ListItemText 
                primary="Standard workday is 8 hours"
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <InfoIcon fontSize="small" color="info" />
              </ListItemIcon>
              <ListItemText 
                primary="EU Working Time Directive compliance tracked"
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
          </List>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default OvertimeWidget;
