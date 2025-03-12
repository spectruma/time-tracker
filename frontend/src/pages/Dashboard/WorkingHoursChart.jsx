// frontend/src/pages/Dashboard/WorkingHoursChart.jsx
import React from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import format from 'date-fns/format';
import parseISO from 'date-fns/parseISO';

const WorkingHoursChart = ({ dailyHours }) => {
  const theme = useTheme();
  
  // Convert dailyHours object to array for the chart
  const chartData = Object.entries(dailyHours).map(([date, hours]) => ({
    date,
    hours,
    formattedDate: format(parseISO(date), 'MMM dd'),
  }));
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box 
          sx={{ 
            bgcolor: 'background.paper', 
            p: 1.5, 
            border: 1, 
            borderColor: 'divider',
            borderRadius: 1,
            boxShadow: 1,
          }}
        >
          <Typography variant="body2">
            {payload[0].payload.formattedDate}
          </Typography>
          <Typography variant="body1" fontWeight="bold" color="primary.main">
            {`${payload[0].value.toFixed(2)} hours`}
          </Typography>
        </Box>
      );
    }
    
    return null;
  };
  
  return (
    <Box sx={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={theme.palette.divider}
          />
          <XAxis 
            dataKey="formattedDate" 
            stroke={theme.palette.text.secondary}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            stroke={theme.palette.text.secondary}
            tick={{ fontSize: 12 }}
            label={{ 
              value: 'Hours',
              angle: -90,
              position: 'insideLeft',
              style: { textAnchor: 'middle', fill: theme.palette.text.secondary }
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="hours" 
            fill={theme.palette.primary.main} 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default WorkingHoursChart;
