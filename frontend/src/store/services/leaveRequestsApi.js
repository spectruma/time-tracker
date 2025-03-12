// frontend/src/store/services/leaveRequestsApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_URL } from '../../config';

// Create the leave requests API service
export const leaveRequestsApi = createApi({
  reducerPath: 'leaveRequestsApi',
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
  tagTypes: ['LeaveRequest'],
  endpoints: (builder) => ({
    // Get leave requests (with optional status filter)
    getLeaveRequests: builder.query({
      query: ({ status, skip = 0, limit = 100 }) => {
        let url = `/leave-requests?skip=${skip}&limit=${limit}`;
        
        if (status) {
          url += `&status=${status}`;
        }
        
        return url;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'LeaveRequest', id })),
              { type: 'LeaveRequest', id: 'LIST' },
            ]
          : [{ type: 'LeaveRequest', id: 'LIST' }],
    }),
    
    // Get a single leave request by ID
    getLeaveRequest: builder.query({
      query: (id) => `/leave-requests/${id}`,
      providesTags: (result, error, id) => [{ type: 'LeaveRequest', id }],
    }),
    
    // Create a new leave request
    createLeaveRequest: builder.mutation({
      query: (data) => ({
        url: '/leave-requests',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'LeaveRequest', id: 'LIST' }],
    }),
    
    // Update a leave request
    updateLeaveRequest: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/leave-requests/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'LeaveRequest', id },
        { type: 'LeaveRequest', id: 'LIST' },
      ],
    }),
    
    // Delete/cancel a leave request
    deleteLeaveRequest: builder.mutation({
      query: (id) => ({
        url: `/leave-requests/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'LeaveRequest', id: 'LIST' }],
    }),
    
    // Process a leave request (approve/reject) (admin only)
    processLeaveRequest: builder.mutation({
      query: ({ id, data }) => ({
        url: `/leave-requests/${id}/action`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'LeaveRequest', id },
        { type: 'LeaveRequest', id: 'LIST' },
      ],
    }),
    
    // Get pending leave requests (admin only)
    getPendingLeaveRequests: builder.query({
      query: ({ skip = 0, limit = 100 }) => 
        `/admin/leave-requests/pending?skip=${skip}&limit=${limit}`,
      providesTags: ['LeaveRequest'],
    }),
  }),
});

// Export the auto-generated hooks
export const {
  useGetLeaveRequestsQuery,
  useGetLeaveRequestQuery,
  useCreateLeaveRequestMutation,
  useUpdateLeaveRequestMutation,
  useDeleteLeaveRequestMutation,
  useProcessLeaveRequestMutation,
  useGetPendingLeaveRequestsQuery,
} = leaveRequestsApi;

