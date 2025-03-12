// frontend/src/pages/Admin/AdminSettings.jsx
import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  TextField, 
  Grid, 
  Switch, 
  FormControlLabel, 
  Card, 
  CardContent, 
  Divider, 
  Alert, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon,
} from '@mui/material';
import { 
  Save as SaveIcon, 
  Refresh as RefreshIcon, 
  Settings as SettingsIcon,
  Event as EventIcon,
  SettingsBackupRestore as ResetIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import DashboardHeader from '../Dashboard/DashboardHeader';

const AdminSettings = () => {
  // State for settings
  const [settings, setSettings] = useState({
    // General settings
    companyName: 'Time Tracker Inc.',
    workingHoursPerDay: 8,
    
    // Holiday settings
    countryCode: 'DE', // Germany 
    holidaysAutoImport: true,
    
    // Leave settings
    vacationDaysPerYear: 25,
    sickDaysPerYear: 10,
    specialPermitDaysPerYear: 5,
    leaveRequestNotifications: true,
    
    // Compliance settings
    enforceWorkingTimeDirective: true,
    maxWeeklyHours: 48,
    minDailyRest: 11,
  });
  
  // Handle settings change
  const handleSettingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : value,
    });
  };
  
  // Handle number input change
  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setSettings({
      ...settings,
      [name]: value === '' ? '' : Number(value),
    });
  };
  
  // Handle save settings
  const handleSaveSettings = () => {
    // In a real app, this would save to the backend
    alert('Settings saved successfully');
  };
  
  // Handle reset to defaults
  const handleResetDefaults = () => {
    if (window.confirm('Are you sure you want to reset to default settings?')) {
      setSettings({
        companyName: 'Time Tracker Inc.',
        workingHoursPerDay: 8,
        countryCode: 'DE',
        holidaysAutoImport: true,
        vacationDaysPerYear: 25,
        sickDaysPerYear: 10,
        specialPermitDaysPerYear: 5,
        leaveRequestNotifications: true,
        enforceWorkingTimeDirective: true,
        maxWeeklyHours: 48,
        minDailyRest: 11,
      });
    }
  };
  
  return (
    <Box>
      <DashboardHeader 
        title="System Settings" 
        subtitle="Configure system-wide settings"
      />
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body1">
          Changes to these settings will affect all users in the system.
        </Typography>
      </Alert>
      
      <Grid container spacing={3}>
        {/* General Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <SettingsIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">General Settings</Typography>
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  name="companyName"
                  label="Company Name"
                  value={settings.companyName}
                  onChange={handleSettingChange}
                  fullWidth
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="workingHoursPerDay"
                  label="Working Hours Per Day"
                  type="number"
                  value={settings.workingHoursPerDay}
                  onChange={handleNumberChange}
                  fullWidth
                  margin="normal"
                  inputProps={{ min: 1, max: 24, step: 0.5 }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Holiday Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <EventIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Holiday Settings</Typography>
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  name="countryCode"
                  label="Country Code for Holidays"
                  value={settings.countryCode}
                  onChange={handleSettingChange}
                  fullWidth
                  margin="normal"
                  helperText="ISO country code (e.g., DE for Germany, US for United States)"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      name="holidaysAutoImport"
                      checked={settings.holidaysAutoImport}
                      onChange={handleSettingChange}
                      color="primary"
                    />
                  }
                  label="Automatically import country holidays"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Leave Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <EventIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Leave Settings</Typography>
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="vacationDaysPerYear"
                  label="Vacation Days/Year"
                  type="number"
                  value={settings.vacationDaysPerYear}
                  onChange={handleNumberChange}
                  fullWidth
                  margin="normal"
                  inputProps={{ min: 0, step: 1 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  name="sickDaysPerYear"
                  label="Sick Days/Year"
                  type="number"
                  value={settings.sickDaysPerYear}
                  onChange={handleNumberChange}
                  fullWidth
                  margin="normal"
                  inputProps={{ min: 0, step: 1 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  name="specialPermitDaysPerYear"
                  label="Special Permit Days"
                  type="number"
                  value={settings.specialPermitDaysPerYear}
                  onChange={handleNumberChange}
                  fullWidth
                  margin="normal"
                  inputProps={{ min: 0, step: 1 }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      name="leaveRequestNotifications"
                      checked={settings.leaveRequestNotifications}
                      onChange={handleSettingChange}
                      color="primary"
                    />
                  }
                  label="Send email notifications for leave requests"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Compliance Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <InfoIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Compliance Settings</Typography>
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      name="enforceWorkingTimeDirective"
                      checked={settings.enforceWorkingTimeDirective}
                      onChange={handleSettingChange}
                      color="primary"
                    />
                  }
                  label="Enforce EU Working Time Directive"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  name="maxWeeklyHours"
                  label="Max Weekly Hours"
                  type="number"
                  value={settings.maxWeeklyHours}
                  onChange={handleNumberChange}
                  fullWidth
                  margin="normal"
                  inputProps={{ min: 1, max: 168, step: 1 }}
                  disabled={!settings.enforceWorkingTimeDirective}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  name="minDailyRest"
                  label="Min Daily Rest (hours)"
                  type="number"
                  value={settings.minDailyRest}
                  onChange={handleNumberChange}
                  fullWidth
                  margin="normal"
                  inputProps={{ min: 0, max: 24, step: 0.5 }}
                  disabled={!settings.enforceWorkingTimeDirective}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
      
      <Box display="flex" justifyContent="space-between" mt={4}>
        <Button
          variant="outlined"
          color="error"
          startIcon={<ResetIcon />}
          onClick={handleResetDefaults}
        >
          Reset to Defaults
        </Button>
        
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSaveSettings}
          >
            Save Changes
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default AdminSettings;