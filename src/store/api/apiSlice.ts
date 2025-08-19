import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../index';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3004/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['User', 'Group', 'License', 'Dashboard'],
  endpoints: (builder) => ({
    // Real API endpoints
    getUsers: builder.query({
      query: () => '/users',
      providesTags: ['User'],
    }),
    getUser: builder.query({
      query: (id) => `/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),
    createUser: builder.mutation({
      query: (user) => ({
        url: '/users',
        method: 'POST',
        body: user,
      }),
      invalidatesTags: ['User'],
    }),
    updateUser: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/users/${id}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'User', id }],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
    getGroups: builder.query({
      query: () => '/groups',
      providesTags: ['Group'],
    }),
    getGroup: builder.query({
      query: (id) => `/groups/${id}`,
      providesTags: (result, error, id) => [{ type: 'Group', id }],
    }),
    createGroup: builder.mutation({
      query: (group) => ({
        url: '/groups',
        method: 'POST',
        body: group,
      }),
      invalidatesTags: ['Group'],
    }),
    updateGroup: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/groups/${id}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Group', id }],
    }),
    deleteGroup: builder.mutation({
      query: (id) => ({
        url: `/groups/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Group'],
    }),
    getLicenses: builder.query({
      query: () => '/licenses',
      providesTags: ['License'],
    }),
    assignLicense: builder.mutation({
      query: ({ userId, licenseId }) => ({
        url: `/users/${userId}/licenses/${licenseId}`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: 'User', id: userId },
        'License',
      ],
    }),
    removeLicense: builder.mutation({
      query: ({ userId, licenseId }) => ({
        url: `/users/${userId}/licenses/${licenseId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: 'User', id: userId },
        'License',
      ],
    }),
    getDashboard: builder.query({
      query: () => '/dashboard',
      providesTags: ['Dashboard'],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetGroupsQuery,
  useGetGroupQuery,
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
  useGetLicensesQuery,
  useAssignLicenseMutation,
  useRemoveLicenseMutation,
  useGetDashboardQuery,
} = apiSlice;