import { apiSlice } from './apiSlice';

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAuthUrl: builder.query({
      query: (state?: string) => ({
        url: '/auth/login',
        params: state ? { state } : undefined,
      }),
    }),
    exchangeCodeForTokens: builder.mutation({
      query: ({ code, state }) => ({
        url: '/auth/callback',
        method: 'POST',
        body: { code, state },
      }),
    }),
    refreshToken: builder.mutation({
      query: ({ refreshToken, userId }) => ({
        url: '/auth/refresh',
        method: 'POST',
        body: { refreshToken, userId },
      }),
    }),
    checkAuthStatus: builder.query({
      query: () => '/auth/status',
    }),
    logout: builder.mutation({
      query: (userId) => ({
        url: '/auth/logout',
        method: 'POST',
        body: { userId },
      }),
    }),
  }),
});

export const {
  useGetAuthUrlQuery,
  useExchangeCodeForTokensMutation,
  useRefreshTokenMutation,
  useCheckAuthStatusQuery,
  useLogoutMutation,
} = authApi;