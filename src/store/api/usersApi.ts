import { apiSlice } from './apiSlice';
import { User, CreateUserRequest, UpdateUserRequest, SearchFilters, PaginationParams, BulkOperation, BulkOperationResult } from '../../types';

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
}

export const usersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<UsersResponse, { filters?: SearchFilters; pagination?: PaginationParams }>({
      query: ({ filters = {}, pagination = { page: 1, pageSize: 25 } }) => {
        const params = new URLSearchParams();
        
        // Add pagination params
        params.append('page', pagination.page.toString());
        params.append('pageSize', pagination.pageSize.toString());
        if (pagination.sortBy) params.append('sortBy', pagination.sortBy);
        if (pagination.sortOrder) params.append('sortOrder', pagination.sortOrder);
        
        // Add filter params
        if (filters.search) params.append('search', filters.search);
        if (filters.department) params.append('department', filters.department);
        if (filters.accountEnabled !== undefined) params.append('accountEnabled', filters.accountEnabled.toString());
        if (filters.hasLicense !== undefined) params.append('hasLicense', filters.hasLicense.toString());
        if (filters.groupId) params.append('groupId', filters.groupId);
        
        return `/users?${params.toString()}`;
      },
      providesTags: ['User'],
    }),
    
    getUser: builder.query<User, string>({
      query: (id) => `/users/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'User', id }],
    }),
    
    createUser: builder.mutation<User, CreateUserRequest>({
      query: (userData) => ({
        url: '/users',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),
    
    updateUser: builder.mutation<User, { id: string; data: UpdateUserRequest }>({
      query: ({ id, data }) => ({
        url: `/users/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'User', id }, 'User'],
    }),
    
    deleteUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
    
    assignLicense: builder.mutation<void, { userId: string; licenseId: string }>({
      query: ({ userId, licenseId }) => ({
        url: `/users/${userId}/licenses`,
        method: 'POST',
        body: { licenseId },
      }),
      invalidatesTags: (_result, _error, { userId }) => [{ type: 'User', id: userId }, 'License'],
    }),
    
    removeLicense: builder.mutation<void, { userId: string; licenseId: string }>({
      query: ({ userId, licenseId }) => ({
        url: `/users/${userId}/licenses/${licenseId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { userId }) => [{ type: 'User', id: userId }, 'License'],
    }),
    
    addToGroup: builder.mutation<void, { userId: string; groupId: string }>({
      query: ({ userId, groupId }) => ({
        url: `/users/${userId}/groups`,
        method: 'POST',
        body: { groupId },
      }),
      invalidatesTags: (_result, _error, { userId }) => [{ type: 'User', id: userId }, 'Group'],
    }),
    
    removeFromGroup: builder.mutation<void, { userId: string; groupId: string }>({
      query: ({ userId, groupId }) => ({
        url: `/users/${userId}/groups/${groupId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { userId }) => [{ type: 'User', id: userId }, 'Group'],
    }),
    
    bulkOperation: builder.mutation<BulkOperationResult, BulkOperation>({
      query: (operation) => ({
        url: '/users/bulk',
        method: 'POST',
        body: operation,
      }),
      invalidatesTags: ['User', 'Group', 'License'],
    }),
    
    exportUsers: builder.mutation<Blob, { filters?: SearchFilters; format: 'csv' | 'xlsx' }>({
      query: ({ filters = {}, format }) => {
        const params = new URLSearchParams();
        params.append('format', format);
        
        if (filters.search) params.append('search', filters.search);
        if (filters.department) params.append('department', filters.department);
        if (filters.accountEnabled !== undefined) params.append('accountEnabled', filters.accountEnabled.toString());
        if (filters.hasLicense !== undefined) params.append('hasLicense', filters.hasLicense.toString());
        if (filters.groupId) params.append('groupId', filters.groupId);
        
        return {
          url: `/users/export?${params.toString()}`,
          method: 'GET',
          responseHandler: (response) => response.blob(),
        };
      },
    }),
    
    getDepartments: builder.query<string[], void>({
      query: () => '/users/departments',
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useAssignLicenseMutation,
  useRemoveLicenseMutation,
  useAddToGroupMutation,
  useRemoveFromGroupMutation,
  useBulkOperationMutation,
  useExportUsersMutation,
  useGetDepartmentsQuery,
} = usersApi;