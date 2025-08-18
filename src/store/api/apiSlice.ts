import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../index';

// Mock data for development
const mockUsers = [
  { id: '1', displayName: 'John Doe', userPrincipalName: 'john@company.com', department: 'IT', jobTitle: 'Developer' },
  { id: '2', displayName: 'Jane Smith', userPrincipalName: 'jane@company.com', department: 'HR', jobTitle: 'Manager' },
  { id: '3', displayName: 'Bob Johnson', userPrincipalName: 'bob@company.com', department: 'Sales', jobTitle: 'Rep' },
];

const mockGroups = [
  { id: '1', displayName: 'IT Department', description: 'Information Technology team', groupType: 'Security' },
  { id: '2', displayName: 'HR Team', description: 'Human Resources team', groupType: 'Microsoft365' },
];

const mockLicenses = [
  { id: '1', name: 'Office 365 E3', totalLicenses: 100, usedLicenses: 75 },
  { id: '2', name: 'Office 365 E5', totalLicenses: 50, usedLicenses: 30 },
];

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
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
    // Mock endpoints that return static data
    getUsers: builder.query({
      queryFn: () => ({ data: mockUsers }),
      providesTags: ['User'],
    }),
    getGroups: builder.query({
      queryFn: () => ({ data: mockGroups }),
      providesTags: ['Group'],
    }),
    getLicenses: builder.query({
      queryFn: () => ({ data: mockLicenses }),
      providesTags: ['License'],
    }),
    getDashboard: builder.query({
      queryFn: () => ({ 
        data: {
          totalUsers: mockUsers.length,
          totalGroups: mockGroups.length,
          totalLicenses: mockLicenses.reduce((sum, license) => sum + license.totalLicenses, 0),
          usedLicenses: mockLicenses.reduce((sum, license) => sum + license.usedLicenses, 0),
        }
      }),
      providesTags: ['Dashboard'],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetGroupsQuery,
  useGetLicensesQuery,
  useGetDashboardQuery,
} = apiSlice;