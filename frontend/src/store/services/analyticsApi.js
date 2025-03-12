// frontend/src/store/services/analyticsApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_URL } from '../../config';

// Create the analytics API service
export const analyticsApi = createApi({
  reducerPath: 'analyticsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/analytics`,
    prepareHeaders: (headers, { getState }) => {
      // Get token from state
      const token = getState().auth.tokens?.accessToken;
      
      // If we have a token, add it to the headers
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      
      return headers;
    },
  }),
  tagTypes: ['Analytics'],
  endpoints: (builder) => ({
    // Get dashboard data
    getDashboardData: builder.query({
      query: ({ startDate, endDate }) => {
        let url = '/dashboard';
        
        if (startDate) {
          url += `?start_date=${startDate}`;
        }
        
        if (endDate) {
          url += startDate ? `&end_date=${endDate}` : `?end_date=${endDate}`;
        }
        
        return url;
      },
      providesTags: ['Analytics'],
    }),
    
    // Generate time entries report
    getTimeEntriesReport: builder.query({
      query: ({ userId, startDate, endDate, format = 'json' }) => {
        let url = '/reports/time-entries?format=' + format;
        
        if (userId) {
          url += `&user_id=${userId}`;
        }
        
        if (startDate) {
          url += `&start_date=${startDate}`;
        }
        
        if (endDate) {
          url += `&end_date=${endDate}`;
        }
        
        return url;
      },
    }),
    
    // Generate leave requests report
    getLeaveRequestsReport: builder.query({
      query: ({ userId, startDate, endDate, status, format = 'json' }) => {
        let url = '/reports/leave-requests?format=' + format;
        
        if (userId) {
          url += `&user_id=${userId}`;
        }
        
        if (startDate) {
          url += `&start_date=${startDate}`;
        }
        
        if (endDate) {
          url += `&end_date=${endDate}`;
        }
        
        if (status) {
          url += `&status=${status}`;
        }
        
        return url;
      },
    }),
    
    // Get team overview (admin only)
    getTeamOverview: builder.query({
      query: ({ date }) => {
        let url = '/team-overview';
        
        if (date) {
          url += `?date=${date}`;
        }
        
        return url;
      },
      providesTags: ['Analytics'],
    }),
    
    // Get working time statistics
    getWorkingTimeStats: builder.query({
      query: ({ userId, startDate, endDate }) => {
        let url = '/working-time-statistics';
        const params = [];
        
        if (userId) {
          params.push(`user_id=${userId}`);
        }
        
        if (startDate) {
          params.push(`start_date=${startDate}`);
        }
        
        if (endDate) {
          params.push(`end_date=${endDate}`);
        }
        
        if (params.length > 0) {
          url += '?' + params.join('&');
        }
        
        return url;
      },
      providesTags: ['Analytics'],
    }),
    
    // Check working time compliance (admin only)
    checkWorkingTimeCompliance: builder.query({
      query: ({ userId, startDate, endDate }) => {
        let url = '/admin/compliance/working-time';
        const params = [];
        
        if (userId) {
          params.push(`user_id=${userId}`);
        }
        
        if (startDate) {
          params.push(`start_date=${startDate}`);
        }
        
        if (endDate) {
          params.push(`end_date=${endDate}`);
        }
        
        if (params.length > 0) {
          url += '?' + params.join('&');
        }
        
        return url;
      },
      providesTags: ['Analytics'],
    }),
  }),
});

// Export the auto-generated hooks
export const {
  useGetDashboardDataQuery,
  useGetTimeEntriesReportQuery,
  useGetLeaveRequestsReportQuery,
  useGetTeamOverviewQuery,
  useGetWorkingTimeStatsQuery,
  useCheckWorkingTimeComplianceQuery,
} = analyticsApi;