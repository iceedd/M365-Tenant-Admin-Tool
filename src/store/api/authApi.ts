import { apiSlice } from './apiSlice';

// Mock auth data for development
const mockUser = {
  id: '1',
  displayName: 'Demo User',
  userPrincipalName: 'demo@company.com',
  roles: ['user', 'admin'],
  department: 'IT',
  jobTitle: 'Administrator'
};

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      queryFn: () => {
        // Mock successful login
        return {
          data: {
            user: mockUser,
            token: 'mock-jwt-token-' + Date.now(),
          }
        };
      },
    }),
    getCurrentUser: builder.query({
      queryFn: () => ({ data: mockUser }),
    }),
    logout: builder.mutation({
      queryFn: () => ({ data: { success: true } }),
    }),
  }),
});

export const {
  useLoginMutation,
  useGetCurrentUserQuery,
  useLogoutMutation,
} = authApi;