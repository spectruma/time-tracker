// frontend/src/pages/TimeTracking/TimeTracker.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  TextField, 
  Grid, 
  Divider,
  CircularProgress, 
} from '@mui/material';
import { 
  PlayArrow as PlayIcon, 
  Stop as StopIcon, 
  Timer as TimerIcon,
} from '@mui/icons-material';
import { 
  useCreateTimeEntryMutation, 
  useUpdateTimeEntryMutation,
} from '../../store/services/timeEntriesApi';

const TimeTracker = ({ onEntryCreated }) => {
  // Tracking state
  const [isTracking, setIsTracking] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [description, setDescription] = useState('');
  const [activeEntryId, setActiveEntryId] = useState(null);
  const [startTime, setStartTime] = useState(null);
  
  // Timer interval ref
  const timerRef = useRef(null);
  
  // RTK Query hooks
  const [createTimeEntry, { isLoading: isCreating }] = useCreateTimeEntryMutation();
  const [updateTimeEntry, { isLoading: isUpdating }] = useUpdateTimeEntryMutation();
  
  // Format elapsed time as HH:MM:SS
  const formatElapsedTime = (seconds) => {
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
        description: description.trim() || null,
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
      alert('Failed to start tracking. Please try again.');
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
      
      if (!activeEntryId) {
        console.error('No active entry ID found');
        return;
      }
      
      const now = new Date();
      await updateTimeEntry({
        id: activeEntryId,
        end_time: now.toISOString(),
        description: description.trim() || null,
      }).unwrap();
      
      setIsTracking(false);
      setActiveEntryId(null);
      setDescription('');
      
      // Notify parent component
      if (onEntryCreated) {
        onEntryCreated();
      }
    } catch (error) {
      console.error('Failed to stop time tracking', error);
      alert('Failed to stop tracking. Please try again.');
    }
  };
  
  // Handle description change
  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  return (
    <Box>
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Box mb={3}>
          <TimerIcon fontSize="large" color="primary" />
          <Typography variant="h4" component="h2" gutterBottom>
            Time Tracker
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your working hours in real-time
          </Typography>
        </Box>
        
        <Box 
          sx={{ 
            bgcolor: 'background.default', 
            borderRadius: 2, 
            p: 3, 
            mb: 3,
            fontFamily: 'monospace',
          }}
        >
          <Typography variant="h1" component="div">
            {formatElapsedTime(elapsedTime)}
          </Typography>
          
          {isTracking && startTime && (
            <Typography variant="body2" color="text.secondary">
              Started at {startTime.toLocaleTimeString()}
            </Typography>
          )}
        </Box>
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <TextField
              label="What are you working on?"
              value={description}
              onChange={handleDescriptionChange}
              fullWidth
              multiline
              rows={2}
              placeholder="Enter a description (optional)"
            />
          </Grid>
        </Grid>
        
        <Button
          variant="contained"
          color={isTracking ? 'error' : 'primary'}
          size="large"
          startIcon={isTracking ? <StopIcon /> : <PlayIcon />}
          onClick={isTracking ? stopTracking : startTracking}
          disabled={isCreating || isUpdating}
          sx={{ minWidth: 200, py: 1.5 }}
        >
          {isCreating || isUpdating ? (
            <CircularProgress size={24} color="inherit" />
          ) : isTracking ? (
            'Stop Tracking'
          ) : (
            'Start Tracking'
          )}
        </Button>
      </Paper>
    </Box>
  );
};

export default TimeTracker;
