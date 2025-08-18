import { apiSlice } from './apiSlice';
import { TenantData, TenantConnectionInfo, M365User, M365Group, M365License } from '../../types';

// Enhanced API endpoints based on PowerShell M365.Authentication module patterns
export const tenantApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Multi-tenant connection management (from PowerShell Connect-ToMicrosoftGraph)
    connectToTenant: builder.mutation<TenantConnectionInfo, { tenantId?: string; scopes?: string[] }>({
      queryFn: async ({ tenantId, scopes }) => {
        // Mock implementation - simulates PowerShell authentication flow
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate auth delay
        
        const mockTenantInfo: TenantConnectionInfo = {
          tenantId: tenantId || 'mock-tenant-id-' + Date.now(),
          tenantName: 'Contoso Corporation',
          environment: 'Global',
          account: 'admin@contoso.com',
          connectedAt: new Date().toISOString(),
          graphConnected: true,
          exchangeOnlineConnected: true,
          permissions: [
            { scope: 'https://graph.microsoft.com/', permission: 'User.ReadWrite.All', granted: true },
            { scope: 'https://graph.microsoft.com/', permission: 'Group.ReadWrite.All', granted: true },
            { scope: 'https://graph.microsoft.com/', permission: 'Directory.ReadWrite.All', granted: true },
            { scope: 'https://outlook.office365.com/', permission: 'Exchange.ManageAsApp', granted: true }
          ]
        };
        
        return { data: mockTenantInfo };
      },
      invalidatesTags: ['Dashboard', 'User', 'Group', 'License'],
    }),

    // Tenant switching (from PowerShell Disconnect-FromMicrosoftGraph)
    switchTenant: builder.mutation<{ success: boolean; message: string }, void>({
      queryFn: async () => {
        // Mock aggressive disconnection like PowerShell version
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate disconnection
        
        return { 
          data: { 
            success: true, 
            message: 'Successfully disconnected from current tenant. Ready for new connection.' 
          } 
        };
      },
      invalidatesTags: ['Dashboard', 'User', 'Group', 'License'],
    }),

    // Comprehensive tenant discovery (from PowerShell Start-TenantDiscovery)
    discoverTenant: builder.query<TenantData, void>({
      queryFn: async () => {
        // Simulate comprehensive tenant discovery like PowerShell version
        await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate discovery time
        
        const mockTenantData: TenantData = {
          tenantId: 'mock-tenant-id',
          tenantName: 'Contoso Corporation',
          domains: [
            { id: 'contoso.com', domainName: 'contoso.com', isDefault: true, isVerified: true },
            { id: 'contoso.onmicrosoft.com', domainName: 'contoso.onmicrosoft.com', isDefault: false, isVerified: true }
          ],
          users: [
            {
              id: '1', displayName: 'John Smith', userPrincipalName: 'john.smith@contoso.com',
              firstName: 'John', lastName: 'Smith', email: 'john.smith@contoso.com',
              department: 'IT', jobTitle: 'Senior Developer', office: 'London', status: 'Active'
            },
            {
              id: '2', displayName: 'Jane Wilson', userPrincipalName: 'jane.wilson@contoso.com',
              firstName: 'Jane', lastName: 'Wilson', email: 'jane.wilson@contoso.com',
              department: 'HR', jobTitle: 'HR Manager', office: 'Manchester', status: 'Active'
            },
            {
              id: '3', displayName: 'Mike Johnson', userPrincipalName: 'mike.johnson@contoso.com',
              firstName: 'Mike', lastName: 'Johnson', email: 'mike.johnson@contoso.com',
              department: 'Sales', jobTitle: 'Sales Representative', office: 'Birmingham', status: 'Active'
            }
          ],
          groups: [
            {
              id: '1', displayName: 'IT Department', description: 'Information Technology team',
              groupType: 'Security', securityEnabled: true, mailEnabled: false, memberCount: 15
            },
            {
              id: '2', displayName: 'HR Team', description: 'Human Resources team',
              groupType: 'Microsoft365', securityEnabled: true, mailEnabled: true, memberCount: 8, email: 'hrteam@contoso.com'
            },
            {
              id: '3', displayName: 'All Employees', description: 'Company-wide distribution list',
              groupType: 'Distribution', securityEnabled: false, mailEnabled: true, memberCount: 150, email: 'allusers@contoso.com'
            },
            {
              id: '4', displayName: 'IT Support', description: 'IT support mail-enabled security group',
              groupType: 'Mail-Enabled Security', securityEnabled: true, mailEnabled: true, memberCount: 5, email: 'itsupport@contoso.com'
            }
          ],
          licenses: [
            {
              id: '1', skuId: 'c42b9cae-ea4f-4ab7-9717-81576235ccac', skuPartNumber: 'SPE_E3',
              displayName: 'Microsoft 365 E3', total: 200, consumed: 145, available: 55
            },
            {
              id: '2', skuId: '6fd2c87f-b296-42f0-b197-1e91e994b900', skuPartNumber: 'SPE_E5',
              displayName: 'Microsoft 365 E5', total: 50, consumed: 32, available: 18
            },
            {
              id: '3', skuId: 'f245ecc8-75af-4f8e-b61f-27d8114de5f3', skuPartNumber: 'SPB',
              displayName: 'Microsoft 365 Business Premium', total: 100, consumed: 78, available: 22
            }
          ],
          mailboxes: [
            {
              id: '1', displayName: 'John Smith', userPrincipalName: 'john.smith@contoso.com',
              primarySmtpAddress: 'john.smith@contoso.com', mailboxType: 'Regular', recipientType: 'UserMailbox'
            },
            {
              id: '2', displayName: 'Support Mailbox', userPrincipalName: 'support@contoso.com',
              primarySmtpAddress: 'support@contoso.com', mailboxType: 'Shared', recipientType: 'SharedMailbox'
            }
          ],
          distributionLists: [
            {
              id: '1', displayName: 'All Employees', email: 'allusers@contoso.com',
              description: 'Company-wide distribution list', memberCount: 150, groupType: 'Distribution'
            },
            {
              id: '2', displayName: 'IT Support', email: 'itsupport@contoso.com',
              description: 'IT support team', memberCount: 5, groupType: 'Mail-Enabled Security'
            }
          ],
          sharedMailboxes: [
            {
              id: '1', displayName: 'Support Mailbox', email: 'support@contoso.com',
              description: 'Customer support shared mailbox'
            },
            {
              id: '2', displayName: 'Reception', email: 'reception@contoso.com',
              description: 'Reception desk shared mailbox'
            }
          ],
          sharePointSites: [
            {
              id: '1', displayName: 'IT Department', url: 'https://contoso.sharepoint.com/sites/IT',
              description: 'IT team collaboration site', template: 'STS#3'
            },
            {
              id: '2', displayName: 'Company Intranet', url: 'https://contoso.sharepoint.com/',
              description: 'Main company intranet', template: 'SITEPAGEPUBLISHING#0'
            }
          ],
          lastDiscovery: new Date().toISOString(),
          connectionStatus: {
            graph: true,
            exchangeOnline: true
          }
        };
        
        return { data: mockTenantData };
      },
      providesTags: ['Dashboard', 'User', 'Group', 'License'],
    }),

    // Get tenant connection status
    getTenantStatus: builder.query<TenantConnectionInfo | null, void>({
      queryFn: () => {
        // Mock current connection status
        const isConnected = localStorage.getItem('mock-tenant-connected') === 'true';
        
        if (isConnected) {
          return {
            data: {
              tenantId: 'mock-tenant-id',
              tenantName: 'Contoso Corporation',
              environment: 'Global',
              account: 'admin@contoso.com',
              connectedAt: new Date().toISOString(),
              graphConnected: true,
              exchangeOnlineConnected: true,
              permissions: []
            }
          };
        }
        
        return { data: null };
      },
    }),

    // Refresh tenant data
    refreshTenantData: builder.mutation<TenantData, void>({
      queryFn: async () => {
        // Simulate refresh like PowerShell Start-TenantDiscovery
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Return updated tenant data (same as discover for demo)
        return { data: {} as TenantData };
      },
      invalidatesTags: ['Dashboard', 'User', 'Group', 'License'],
    }),
  }),
});

export const {
  useConnectToTenantMutation,
  useSwitchTenantMutation,
  useDiscoverTenantQuery,
  useGetTenantStatusQuery,
  useRefreshTenantDataMutation,
} = tenantApi;