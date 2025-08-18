import { apiSlice } from './apiSlice';
import { Group, CreateGroupRequest, SearchFilters, PaginationParams } from '../../types';

interface GroupsResponse {
  groups: Group[];
  total: number;
  page: number;
  pageSize: number;
}

interface GroupMember {
  id: string;
  displayName: string;
  userPrincipalName: string;
  jobTitle?: string;
  department?: string;
}

export const groupsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getGroups: builder.query<GroupsResponse, { filters?: SearchFilters; pagination?: PaginationParams }>({
      query: ({ filters = {}, pagination = { page: 1, pageSize: 25 } }) => {
        const params = new URLSearchParams();
        
        params.append('page', pagination.page.toString());
        params.append('pageSize', pagination.pageSize.toString());
        if (pagination.sortBy) params.append('sortBy', pagination.sortBy);
        if (pagination.sortOrder) params.append('sortOrder', pagination.sortOrder);
        
        if (filters.search) params.append('search', filters.search);
        
        return `/groups?${params.toString()}`;
      },
      providesTags: ['Group'],
    }),
    
    getGroup: builder.query<Group, string>({
      query: (id) => `/groups/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Group', id }],
    }),
    
    createGroup: builder.mutation<Group, CreateGroupRequest>({
      query: (groupData) => ({
        url: '/groups',
        method: 'POST',
        body: groupData,
      }),
      invalidatesTags: ['Group'],
    }),
    
    updateGroup: builder.mutation<Group, { id: string; data: Partial<CreateGroupRequest> }>({
      query: ({ id, data }) => ({
        url: `/groups/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Group', id }, 'Group'],
    }),
    
    deleteGroup: builder.mutation<void, string>({
      query: (id) => ({
        url: `/groups/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Group'],
    }),
    
    getGroupMembers: builder.query<GroupMember[], string>({
      query: (groupId) => `/groups/${groupId}/members`,
      providesTags: (_result, _error, groupId) => [{ type: 'Group', id: groupId }],
    }),
    
    addMember: builder.mutation<void, { groupId: string; userId: string }>({
      query: ({ groupId, userId }) => ({
        url: `/groups/${groupId}/members`,
        method: 'POST',
        body: { userId },
      }),
      invalidatesTags: (_result, _error, { groupId }) => [{ type: 'Group', id: groupId }, 'User'],
    }),
    
    removeMember: builder.mutation<void, { groupId: string; userId: string }>({
      query: ({ groupId, userId }) => ({
        url: `/groups/${groupId}/members/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { groupId }) => [{ type: 'Group', id: groupId }, 'User'],
    }),
    
    getGroupOwners: builder.query<GroupMember[], string>({
      query: (groupId) => `/groups/${groupId}/owners`,
      providesTags: (_result, _error, groupId) => [{ type: 'Group', id: groupId }],
    }),
    
    addOwner: builder.mutation<void, { groupId: string; userId: string }>({
      query: ({ groupId, userId }) => ({
        url: `/groups/${groupId}/owners`,
        method: 'POST',
        body: { userId },
      }),
      invalidatesTags: (_result, _error, { groupId }) => [{ type: 'Group', id: groupId }],
    }),
    
    removeOwner: builder.mutation<void, { groupId: string; userId: string }>({
      query: ({ groupId, userId }) => ({
        url: `/groups/${groupId}/owners/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { groupId }) => [{ type: 'Group', id: groupId }],
    }),
  }),
});

export const {
  useGetGroupsQuery,
  useGetGroupQuery,
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
  useGetGroupMembersQuery,
  useAddMemberMutation,
  useRemoveMemberMutation,
  useGetGroupOwnersQuery,
  useAddOwnerMutation,
  useRemoveOwnerMutation,
} = groupsApi;