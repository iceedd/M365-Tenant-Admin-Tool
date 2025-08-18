import { apiSlice } from './apiSlice';
import { License, LicenseUsageStat } from '../../types';

export const licensesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getLicenses: builder.query<License[], void>({
      query: () => '/licenses',
      providesTags: ['License'],
    }),
    
    getLicense: builder.query<License, string>({
      query: (skuId) => `/licenses/${skuId}`,
      providesTags: (_result, _error, skuId) => [{ type: 'License', id: skuId }],
    }),
    
    getLicenseUsage: builder.query<LicenseUsageStat[], void>({
      query: () => '/licenses/usage',
      providesTags: ['License'],
    }),
    
    getAvailableLicenses: builder.query<License[], void>({
      query: () => '/licenses/available',
      providesTags: ['License'],
    }),
    
    getUsersWithLicense: builder.query<Array<{
      id: string;
      displayName: string;
      userPrincipalName: string;
      assignedDate: string;
    }>, string>({
      query: (skuId) => `/licenses/${skuId}/users`,
      providesTags: (_result, _error, skuId) => [{ type: 'License', id: skuId }],
    }),
    
    bulkAssignLicense: builder.mutation<void, { skuId: string; userIds: string[] }>({
      query: ({ skuId, userIds }) => ({
        url: `/licenses/${skuId}/assign`,
        method: 'POST',
        body: { userIds },
      }),
      invalidatesTags: ['License', 'User'],
    }),
    
    bulkRevokeLicense: builder.mutation<void, { skuId: string; userIds: string[] }>({
      query: ({ skuId, userIds }) => ({
        url: `/licenses/${skuId}/revoke`,
        method: 'POST',
        body: { userIds },
      }),
      invalidatesTags: ['License', 'User'],
    }),
  }),
});

export const {
  useGetLicensesQuery,
  useGetLicenseQuery,
  useGetLicenseUsageQuery,
  useGetAvailableLicensesQuery,
  useGetUsersWithLicenseQuery,
  useBulkAssignLicenseMutation,
  useBulkRevokeLicenseMutation,
} = licensesApi;