// frontend/src/pages/Dashboard/TimeTrackerCard.jsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button,
  Stack,
  CircularProgress, 
} from '@mui/material';
import { 
  PlayArrow as PlayIcon, 
  Stop as StopIcon,
  Timer as TimerIcon 
} from '@mui/icons-material';
import { useCreateTimeEntryMutation, useUpdateTimeEntryMutation } from '../../store/services/timeEntriesApi';

const TimeTrackerCard = () => {
  // Active time tracking state
  const [isTracking, setIsTracking] = useState(false);
  const [activeEntryId, setActiveEntryId] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState(null);
  
  // Timer interval ref
  const timerRef = React.useRef(null);
  
  // RTK Query hooks
  const [createTimeEntry, { isLoading: isCreating }] = useCreateTimeEntryMutation();
  const [updateTimeEntry, { isLoading: isUpdating }] = useUpdateTimeEntryMutation();
  
  // Format time as HH:MM:SS
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0'),
    ].join(':');
  };
  
  // Start time tracking
  const startTracking = async () => {
    try {
      const now = new Date();
      const result = await createTimeEntry({
        start_time: now.toISOString(),
        is_manual_entry: false,
      }).unwrap();
      
      setActiveEntryId(result.id);
      setIsTracking(true);
      setStartTime(now);
      setElapsedTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start time tracking', error);
    }
  };
  
  // Stop time tracking
  const stopTracking = async () => {
    try {
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      const now = new Date();
      await updateTimeEntry({
        id: activeEntryId,
        end_time: now.toISOString(),
      }).unwrap();
      
      setIsTracking(false);
      setActiveEntryId(null);
    } catch (error) {
      console.error('Failed to stop time tracking', error);
    }
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack spacing={3}>
          <Box display="flex" alignItems="center">
            <TimerIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Time Tracker</Typography>
          </Box>
          
          <Box textAlign="center" py={2}>
            <Typography variant="h3" fontFamily="monospace" gutterBottom>
              {formatTime(elapsedTime)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isTracking ? 'Currently tracking' : 'Not tracking'}
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            color={isTracking ? 'error' : 'primary'}
            startIcon={isTracking ? <StopIcon /> : <PlayIcon />}
            onClick={isTracking ? stopTracking : startTracking}
            disabled={isCreating || isUpdating}
            fullWidth
            size="large"
          >
            {isCreating || isUpdating ? (
              <CircularProgress size={24} color="inherit" />
            ) : isTracking ? (
              'Stop Tracking'
            ) : (
              'Start Tracking'
            )}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default TimeTrackerCard;
