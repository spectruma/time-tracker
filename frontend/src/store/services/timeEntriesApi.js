// frontend/src/store/services/timeEntriesApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_URL } from '../../config';

// Create the time entries API service
export const timeEntriesApi = createApi({
  reducerPath: 'timeEntriesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}`,
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
  tagTypes: ['TimeEntry'],
  endpoints: (builder) => ({
    // Get time entries (with optional date range)
    getTimeEntries: builder.query({
      query: ({ startDate, endDate, skip = 0, limit = 100 }) => {
        let url = `/time-entries?skip=${skip}&limit=${limit}`;
        
        if (startDate) {
          url += `&start_date=${startDate}`;
        }
        
        if (endDate) {
          url += `&end_date=${endDate}`;
        }
        
        return url;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'TimeEntry', id })),
              { type: 'TimeEntry', id: 'LIST' },
            ]
          : [{ type: 'TimeEntry', id: 'LIST' }],
    }),
    
    // Get a single time entry by ID
    getTimeEntry: builder.query({
      query: (id) => `/time-entries/${id}`,
      providesTags: (result, error, id) => [{ type: 'TimeEntry', id }],
    }),
    
    // Create a new time entry
    createTimeEntry: builder.mutation({
      query: (data) => ({
        url: '/time-entries',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'TimeEntry', id: 'LIST' }],
    }),
    
    // Update a time entry
    updateTimeEntry: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/time-entries/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'TimeEntry', id },
        { type: 'TimeEntry', id: 'LIST' },
      ],
    }),
    
    // Delete a time entry
    deleteTimeEntry: builder.mutation({
      query: (id) => ({
        url: `/time-entries/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'TimeEntry', id: 'LIST' }],
    }),
    
    // Approve a time entry (admin only)
    approveTimeEntry: builder.mutation({
      query: ({ id, data }) => ({
        url: `/time-entries/${id}/approve`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'TimeEntry', id },
        { type: 'TimeEntry', id: 'LIST' },
      ],
    }),
    
    // Get pending time entries for approval (admin only)
    getPendingTimeEntries: builder.query({
      query: ({ skip = 0, limit = 100 }) => 
        `/admin/time-entries/pending?skip=${skip}&limit=${limit}`,
      providesTags: ['TimeEntry'],
    }),
  }),
});

// Export the auto-generated hooks
export const {
  useGetTimeEntriesQuery,
  useGetTimeEntryQuery,
  useCreateTimeEntryMutation,
  useUpdateTimeEntryMutation,
  useDeleteTimeEntryMutation,
  useApproveTimeEntryMutation,
  useGetPendingTimeEntriesQuery,
} = timeEntriesApi;
