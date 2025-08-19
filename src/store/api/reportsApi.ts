import { apiSlice } from './apiSlice';

// Reports API for fetching real tenant data from Microsoft Graph
export const reportsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get usage metrics for the tenant
    getUsageMetrics: builder.query({
      query: (dateRange) => `/reports/usage?range=${dateRange}`,
    }),
    
    // Get license reports for the tenant
    getLicenseReports: builder.query({
      query: (dateRange) => `/reports/licenses?range=${dateRange}`,
    }),
    
    // Get user activity reports for the tenant
    getUserActivityReports: builder.query({
      query: (dateRange) => `/reports/users/activity?range=${dateRange}`,
    }),
    
    // Get group membership reports for the tenant
    getGroupMembershipReports: builder.query({
      query: (dateRange) => `/reports/groups?range=${dateRange}`,
    }),
    
    // Get security reports for the tenant
    getSecurityReports: builder.query({
      query: (dateRange) => `/reports/security?range=${dateRange}`,
    }),
    
    // Get all reports in a single request (useful for dashboard)
    getAllReports: builder.query({
      query: (dateRange) => `/reports/all?range=${dateRange}`,
    }),
  }),
});

export const {
  useGetUsageMetricsQuery,
  useGetLicenseReportsQuery,
  useGetUserActivityReportsQuery,
  useGetGroupMembershipReportsQuery,
  useGetSecurityReportsQuery,
  useGetAllReportsQuery,
} = reportsApi;