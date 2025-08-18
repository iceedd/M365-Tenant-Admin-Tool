import { apiSlice } from './apiSlice';
import { DashboardMetrics, Activity } from '../../types';

export const dashboardApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardMetrics: builder.query<DashboardMetrics, void>({
      query: () => '/dashboard/metrics',
      providesTags: ['Dashboard'],
    }),
    
    getRecentActivities: builder.query<Activity[], { limit?: number }>({
      query: ({ limit = 10 } = {}) => `/dashboard/activities?limit=${limit}`,
      providesTags: ['Activity'],
    }),
    
    getUsersByDepartment: builder.query<Array<{ department: string; userCount: number }>, void>({
      query: () => '/dashboard/users-by-department',
      providesTags: ['Dashboard'],
    }),
    
    getLicenseUsageStats: builder.query<Array<{
      licenseName: string;
      used: number;
      available: number;
      total: number;
    }>, void>({
      query: () => '/dashboard/license-usage',
      providesTags: ['Dashboard'],
    }),
    
    getActiveUsersOverTime: builder.query<Array<{
      date: string;
      activeUsers: number;
      newUsers: number;
    }>, { days?: number }>({
      query: ({ days = 30 } = {}) => `/dashboard/active-users?days=${days}`,
      providesTags: ['Dashboard'],
    }),
    
    getTopGroups: builder.query<Array<{
      id: string;
      displayName: string;
      memberCount: number;
    }>, { limit?: number }>({
      query: ({ limit = 5 } = {}) => `/dashboard/top-groups?limit=${limit}`,
      providesTags: ['Dashboard'],
    }),
  }),
});

export const {
  useGetDashboardMetricsQuery,
  useGetRecentActivitiesQuery,
  useGetUsersByDepartmentQuery,
  useGetLicenseUsageStatsQuery,
  useGetActiveUsersOverTimeQuery,
  useGetTopGroupsQuery,
} = dashboardApi;