import { apiSlice } from './apiSlice';

// Settings API for fetching and managing app settings and admin users
export const settingsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get user preferences
    getUserPreferences: builder.query({
      query: () => '/settings/user-preferences',
    }),
    
    // Update user preferences
    updateUserPreferences: builder.mutation({
      query: (preferences) => ({
        url: '/settings/user-preferences',
        method: 'PUT',
        body: preferences,
      }),
    }),
    
    // Get tenant settings
    getTenantSettings: builder.query({
      query: () => '/settings/tenant',
    }),
    
    // Update tenant settings
    updateTenantSettings: builder.mutation({
      query: (settings) => ({
        url: '/settings/tenant',
        method: 'PUT',
        body: settings,
      }),
    }),
    
    // Get security overview
    getSecurityOverview: builder.query({
      query: () => '/settings/security-overview',
    }),
    
    // Get admin users
    getAdminUsers: builder.query({
      query: () => '/settings/admin-users',
    }),
    
    // Add admin user
    addAdminUser: builder.mutation({
      query: (user) => ({
        url: '/settings/admin-users',
        method: 'POST',
        body: user,
      }),
    }),
    
    // Remove admin user
    removeAdminUser: builder.mutation({
      query: (userId) => ({
        url: `/settings/admin-users/${userId}`,
        method: 'DELETE',
      }),
    }),
  }),
});

export const {
  useGetUserPreferencesQuery,
  useUpdateUserPreferencesMutation,
  useGetTenantSettingsQuery,
  useUpdateTenantSettingsMutation,
  useGetSecurityOverviewQuery,
  useGetAdminUsersQuery,
  useAddAdminUserMutation,
  useRemoveAdminUserMutation,
} = settingsApi;