import { Client, GraphError } from '@microsoft/microsoft-graph-client';
import { AuthenticationResult, PublicClientApplication } from '@azure/msal-browser';
import { graphEndpoints, graphScopes } from '../config/azureConfig';
import type { User, Group, Organization, SubscribedSku, DirectoryAudit, DirectoryRole } from '@microsoft/microsoft-graph-types';

export class GraphApiService {
  private graphClient: Client | null = null;
  private msalInstance: PublicClientApplication;

  constructor(msalInstance: PublicClientApplication) {
    this.msalInstance = msalInstance;
  }

  /**
   * Initialize Graph client with authentication
   */
  private async initializeGraphClient(scopes: string[] = ['User.Read']): Promise<Client> {
    if (this.graphClient) {
      return this.graphClient;
    }

    try {
      // Get access token
      const account = this.msalInstance.getActiveAccount();
      if (!account) {
        throw new Error('No active account found. Please sign in.');
      }

      const response: AuthenticationResult = await this.msalInstance.acquireTokenSilent({
        scopes,
        account,
      });

      // Create Graph client with token
      this.graphClient = Client.init({
        authProvider: async (done) => {
          done(null, response.accessToken);
        },
        debugLogging: import.meta.env.VITE_DEBUG_MODE === 'true',
      });

      return this.graphClient;
    } catch (error) {
      console.error('Failed to initialize Graph client:', error);
      throw error;
    }
  }

  /**
   * Handle Graph API errors consistently
   */
  private handleGraphError(error: any): never {
    if (error instanceof GraphError) {
      console.error('Graph API Error:', {
        code: error.code,
        message: error.message,
        details: error.body,
      });
      throw new Error(`Graph API Error: ${error.message}`);
    }
    
    console.error('Unexpected error:', error);
    throw error;
  }

  // ====== USER MANAGEMENT ======

  /**
   * Get all users with pagination
   */
  async getUsers(select?: string[], filter?: string, top?: number): Promise<User[]> {
    try {
      const client = await this.initializeGraphClient(graphScopes.users);
      let request = client.api('/users');

      if (select) {
        request = request.select(select);
      }
      if (filter) {
        request = request.filter(filter);
      }
      if (top) {
        request = request.top(top);
      }

      const response = await request.get();
      return response.value || [];
    } catch (error) {
      this.handleGraphError(error);
    }
  }

  /**
   * Create a new user
   */
  async createUser(userData: {
    displayName: string;
    userPrincipalName: string;
    mailNickname: string;
    passwordProfile: {
      forceChangePasswordNextSignIn: boolean;
      password: string;
    };
    accountEnabled: boolean;
    usageLocation?: string;
    jobTitle?: string;
    department?: string;
    officeLocation?: string;
  }): Promise<User> {
    try {
      const client = await this.initializeGraphClient(graphScopes.users);
      const response = await client.api('/users').post(userData);
      return response;
    } catch (error) {
      this.handleGraphError(error);
    }
  }

  /**
   * Update user
   */
  async updateUser(userId: string, userData: Partial<User>): Promise<void> {
    try {
      const client = await this.initializeGraphClient(graphScopes.users);
      await client.api(`/users/${userId}`).patch(userData);
    } catch (error) {
      this.handleGraphError(error);
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      const client = await this.initializeGraphClient(graphScopes.users);
      await client.api(`/users/${userId}`).delete();
    } catch (error) {
      this.handleGraphError(error);
    }
  }

  /**
   * Check if username is available
   */
  async checkUsernameAvailability(userPrincipalName: string): Promise<{ available: boolean; suggestions?: string[] }> {
    try {
      const client = await this.initializeGraphClient(graphScopes.users);
      
      // Try to get user by UPN
      try {
        await client.api(`/users/${userPrincipalName}`).select('id').get();
        // If we get here, user exists
        
        // Generate suggestions
        const [localPart, domain] = userPrincipalName.split('@');
        const suggestions = [
          `${localPart}1@${domain}`,
          `${localPart}.new@${domain}`,
          `${localPart}${new Date().getFullYear()}@${domain}`
        ];
        
        return { available: false, suggestions };
      } catch (error: any) {
        // If error is 'Not Found', username is available
        if (error?.code === 'Request_ResourceNotFound' || error?.status === 404) {
          return { available: true };
        }
        throw error;
      }
    } catch (error) {
      this.handleGraphError(error);
    }
  }

  /**
   * Bulk create users with progress tracking
   */
  async createUsersBulk(
    users: Array<{
      displayName: string;
      userPrincipalName: string;
      password: string;
      firstName?: string;
      lastName?: string;
      jobTitle?: string;
      department?: string;
      office?: string;
      manager?: string;
      usageLocation?: string;
      licenseType?: string;
    }>,
    onProgress?: (progress: { processed: number; successful: number; failed: number; errors: any[] }) => void
  ): Promise<{ successful: User[]; failed: Array<{ user: any; error: string }> }> {
    const successful: User[] = [];
    const failed: Array<{ user: any; error: string }> = [];
    const errors: any[] = [];
    
    try {
      const client = await this.initializeGraphClient(graphScopes.users);
      
      for (let i = 0; i < users.length; i++) {
        const userData = users[i];
        
        try {
          console.log(`🔄 Creating user ${i + 1}/${users.length}: ${userData.displayName} (${userData.userPrincipalName})`);
          
          const userPayload = {
            displayName: userData.displayName,
            userPrincipalName: userData.userPrincipalName,
            mailNickname: userData.userPrincipalName.split('@')[0],
            passwordProfile: {
              forceChangePasswordNextSignIn: true,
              password: userData.password
            },
            accountEnabled: true,
            usageLocation: userData.usageLocation || 'US',
            jobTitle: userData.jobTitle,
            department: userData.department,
            officeLocation: userData.office,
            givenName: userData.firstName,
            surname: userData.lastName
          };
          
          console.log(`📝 User payload:`, JSON.stringify(userPayload, null, 2));
          
          const createdUser = await client.api('/users').post(userPayload);
          
          console.log(`✅ SUCCESS: Created user ${userData.displayName}`, {
            id: createdUser.id,
            userPrincipalName: createdUser.userPrincipalName,
            displayName: createdUser.displayName,
            accountEnabled: createdUser.accountEnabled
          });

          // Assign license if provided
          if (userData.licenseType && createdUser.id) {
            try {
              console.log(`📄 Attempting to assign license ${userData.licenseType} to user ${createdUser.userPrincipalName}`);
              
              // Get available SKUs to find the correct SKU ID
              const skus = await client.api('/subscribedSkus').get();
              const targetSku = skus.value.find((sku: any) => 
                sku.skuPartNumber === userData.licenseType.toUpperCase() ||
                sku.skuId === userData.licenseType
              );
              
              if (targetSku && targetSku.prepaidUnits.enabled > targetSku.consumedUnits) {
                const licensePayload = {
                  addLicenses: [{
                    skuId: targetSku.skuId,
                    disabledPlans: []
                  }],
                  removeLicenses: []
                };
                
                await client.api(`/users/${createdUser.id}/assignLicense`).post(licensePayload);
                console.log(`✅ LICENSE: Successfully assigned ${userData.licenseType} to ${createdUser.userPrincipalName}`);
                
                // Add license info to created user object
                createdUser.assignedLicenses = [{ skuId: targetSku.skuId }];
                createdUser.licenseAssigned = userData.licenseType;
              } else if (!targetSku) {
                console.warn(`⚠️ LICENSE: SKU ${userData.licenseType} not found in tenant`);
                createdUser.licenseWarning = `License ${userData.licenseType} not found`;
              } else {
                console.warn(`⚠️ LICENSE: No available licenses for ${userData.licenseType} (${targetSku.prepaidUnits.enabled - targetSku.consumedUnits} remaining)`);
                createdUser.licenseWarning = `No available ${userData.licenseType} licenses`;
              }
            } catch (licenseError: any) {
              console.error(`❌ LICENSE: Failed to assign license ${userData.licenseType} to ${createdUser.userPrincipalName}:`, licenseError);
              createdUser.licenseError = licenseError?.body?.error?.message || licenseError?.message || 'License assignment failed';
            }
          }

          successful.push(createdUser);
          
        } catch (error: any) {
          console.error(`❌ FAILED: User ${userData.displayName} (${userData.userPrincipalName})`, {
            error: error,
            status: error?.status || error?.code,
            message: error?.body?.error?.message || error?.message,
            details: error?.body?.error?.details || error?.body || {}
          });
          
          const errorMessage = error?.body?.error?.message || error?.message || `HTTP ${error?.status || 'Unknown'}: Unknown error`;
          failed.push({ user: userData, error: errorMessage });
          errors.push({
            user: userData.userPrincipalName,
            error: errorMessage,
            details: error?.body?.error?.details || []
          });
        }
        
        // Report progress
        if (onProgress) {
          onProgress({
            processed: i + 1,
            successful: successful.length,
            failed: failed.length,
            errors
          });
        }
        
        // Add small delay to avoid throttling
        if (i < users.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Post-creation verification: Query Graph API to confirm created users
      console.log('🔍 Post-creation verification: Querying Graph API for recently created users...');
      
      if (successful.length > 0) {
        try {
          const recentlyCreated = [];
          for (const user of successful) {
            try {
              const verificationUser = await client.api(`/users/${user.id}`).get();
              recentlyCreated.push({
                id: verificationUser.id,
                displayName: verificationUser.displayName,
                userPrincipalName: verificationUser.userPrincipalName,
                accountEnabled: verificationUser.accountEnabled,
                createdDateTime: verificationUser.createdDateTime
              });
            } catch (verifyError) {
              console.warn(`⚠️ Could not verify user ${user.userPrincipalName}:`, verifyError);
            }
          }
          
          console.log('📊 BULK IMPORT SUMMARY:');
          console.log('===============================');
          console.log(`📈 Total processed: ${users.length}`);
          console.log(`✅ Successfully created: ${successful.length}`);
          console.log(`❌ Failed: ${failed.length}`);
          console.log('');
          console.log('🎯 VERIFIED CREATED USERS FROM GRAPH API:');
          console.log('------------------------------------------');
          recentlyCreated.forEach((user, index) => {
            console.log(`${index + 1}. ${user.displayName} (${user.userPrincipalName})`);
            console.log(`   ID: ${user.id}`);
            console.log(`   Status: ${user.accountEnabled ? 'Active' : 'Disabled'}`);
            console.log(`   Created: ${user.createdDateTime || 'Unknown'}`);
            console.log('');
          });
          
          if (failed.length > 0) {
            console.log('❌ FAILED USERS:');
            console.log('------------------');
            failed.forEach((failure, index) => {
              console.log(`${index + 1}. ${failure.user.displayName} (${failure.user.userPrincipalName})`);
              console.log(`   Error: ${failure.error}`);
              console.log('');
            });
          }
          
        } catch (verificationError) {
          console.error('Failed to verify created users:', verificationError);
        }
      }
      
      return { successful, failed };
      
    } catch (error) {
      console.error('❌ Bulk user creation failed:', error);
      this.handleGraphError(error);
    }
  }

  // ====== GROUP MANAGEMENT ======

  /**
   * Get all groups
   */
  async getGroups(select?: string[], filter?: string): Promise<Group[]> {
    try {
      const client = await this.initializeGraphClient(graphScopes.groups);
      let request = client.api('/groups');

      if (select) {
        request = request.select(select);
      }
      if (filter) {
        request = request.filter(filter);
      }

      const response = await request.get();
      return response.value || [];
    } catch (error) {
      this.handleGraphError(error);
    }
  }

  /**
   * Create a new group
   */
  async createGroup(groupData: {
    displayName: string;
    description?: string;
    groupTypes: string[];
    mailEnabled: boolean;
    mailNickname: string;
    securityEnabled: boolean;
  }): Promise<Group> {
    try {
      const client = await this.initializeGraphClient(graphScopes.groups);
      const response = await client.api('/groups').post(groupData);
      return response;
    } catch (error) {
      this.handleGraphError(error);
    }
  }

  /**
   * Add member to group
   */
  async addGroupMember(groupId: string, userId: string): Promise<void> {
    try {
      const client = await this.initializeGraphClient(graphScopes.groups);
      const requestBody = {
        '@odata.id': `${graphEndpoints.users}/${userId}`
      };
      await client.api(`/groups/${groupId}/members/$ref`).post(requestBody);
    } catch (error) {
      this.handleGraphError(error);
    }
  }

  /**
   * Remove member from group
   */
  async removeGroupMember(groupId: string, userId: string): Promise<void> {
    try {
      const client = await this.initializeGraphClient(graphScopes.groups);
      await client.api(`/groups/${groupId}/members/${userId}/$ref`).delete();
    } catch (error) {
      this.handleGraphError(error);
    }
  }

  /**
   * Get group members
   */
  async getGroupMembers(groupId: string): Promise<User[]> {
    try {
      const client = await this.initializeGraphClient(graphScopes.groups);
      const response = await client.api(`/groups/${groupId}/members`)
        .select('id,displayName,userPrincipalName,mail,jobTitle,department,accountEnabled,userType')
        .get();
      console.log(`🔄 GraphApiService.getGroupMembers: API returned ${response.value?.length || 0} members for group ${groupId}`);
      return response.value || [];
    } catch (error) {
      console.error(`❌ GraphApiService.getGroupMembers: API error for group ${groupId}:`, error);
      this.handleGraphError(error);
    }
  }

  /**
   * Get group owners
   */
  async getGroupOwners(groupId: string): Promise<User[]> {
    try {
      const client = await this.initializeGraphClient(graphScopes.groups);
      const response = await client.api(`/groups/${groupId}/owners`)
        .select('id,displayName,userPrincipalName,mail,jobTitle,department,accountEnabled,userType')
        .get();
      console.log(`🔄 GraphApiService.getGroupOwners: API returned ${response.value?.length || 0} owners for group ${groupId}`);
      return response.value || [];
    } catch (error) {
      console.error(`❌ GraphApiService.getGroupOwners: API error for group ${groupId}:`, error);
      this.handleGraphError(error);
    }
  }

  /**
   * Update group properties
   */
  async updateGroup(groupId: string, updates: Partial<Group>): Promise<void> {
    try {
      const client = await this.initializeGraphClient(graphScopes.groups);
      await client.api(`/groups/${groupId}`).patch(updates);
    } catch (error) {
      this.handleGraphError(error);
    }
  }

  /**
   * Add owner to group
   */
  async addGroupOwner(groupId: string, userId: string): Promise<void> {
    try {
      const client = await this.initializeGraphClient(graphScopes.groups);
      const requestBody = {
        '@odata.id': `${graphEndpoints.users}/${userId}`
      };
      await client.api(`/groups/${groupId}/owners/$ref`).post(requestBody);
    } catch (error) {
      this.handleGraphError(error);
    }
  }

  // ====== LICENSING ======

  /**
   * Get organization subscribed SKUs (licenses)
   */
  async getSubscribedSkus(): Promise<SubscribedSku[]> {
    try {
      const client = await this.initializeGraphClient(graphScopes.organization);
      const response = await client.api('/subscribedSkus').get();
      return response.value || [];
    } catch (error) {
      this.handleGraphError(error);
    }
  }

  /**
   * Assign license to user
   */
  async assignLicense(userId: string, skuId: string): Promise<void> {
    try {
      const client = await this.initializeGraphClient(graphScopes.users);
      const requestBody = {
        addLicenses: [{
          skuId: skuId,
          disabledPlans: []
        }],
        removeLicenses: []
      };
      await client.api(`/users/${userId}/assignLicense`).post(requestBody);
    } catch (error) {
      this.handleGraphError(error);
    }
  }

  /**
   * Remove license from user
   */
  async removeLicense(userId: string, skuId: string): Promise<void> {
    try {
      const client = await this.initializeGraphClient(graphScopes.users);
      const requestBody = {
        addLicenses: [],
        removeLicenses: [skuId]
      };
      await client.api(`/users/${userId}/assignLicense`).post(requestBody);
    } catch (error) {
      this.handleGraphError(error);
    }
  }

  // ====== ORGANIZATION & TENANT ======

  /**
   * Get organization information
   */
  async getOrganization(): Promise<Organization[]> {
    try {
      const client = await this.initializeGraphClient(graphScopes.organization);
      const response = await client.api('/organization').get();
      return response.value || [];
    } catch (error) {
      this.handleGraphError(error);
    }
  }

  // ====== AUDIT LOGS ======

  /**
   * Get directory audit logs
   */
  async getAuditLogs(filter?: string, top?: number): Promise<DirectoryAudit[]> {
    try {
      const client = await this.initializeGraphClient(graphScopes.auditLogs);
      let request = client.api('/auditLogs/directoryAudits');

      if (filter) {
        request = request.filter(filter);
      }
      if (top) {
        request = request.top(top);
      }

      const response = await request.get();
      return response.value || [];
    } catch (error) {
      this.handleGraphError(error);
    }
  }

  // ====== REPORTS ======

  /**
   * Get user activity reports  
   */
  async getUserActivityReports(period: string = 'D30'): Promise<any> {
    try {
      const client = await this.initializeGraphClient(graphScopes.reports);
      const response = await client.api(`/reports/getOffice365ActiveUserDetail(period='${period}')`).get();
      return response;
    } catch (error) {
      console.warn('Reports may not be available in all tenants:', error);
      return null;
    }
  }

  // ====== DIRECTORY ROLES ======

  /**
   * Get all directory roles
   */
  async getDirectoryRoles(): Promise<DirectoryRole[]> {
    try {
      const client = await this.initializeGraphClient(graphScopes.directory);
      const response = await client.api('/directoryRoles').get();
      return response.value || [];
    } catch (error) {
      this.handleGraphError(error);
    }
  }

  /**
   * Get members of a specific directory role
   */
  async getDirectoryRoleMembers(roleId: string): Promise<User[]> {
    try {
      const client = await this.initializeGraphClient(graphScopes.directory);
      const response = await client.api(`/directoryRoles/${roleId}/members`).get();
      return response.value || [];
    } catch (error) {
      this.handleGraphError(error);
    }
  }

  /**
   * Get all users with administrative roles
   */
  async getAdministrativeUsers(): Promise<{ user: User; roles: DirectoryRole[] }[]> {
    try {
      const [roles, allUsers] = await Promise.all([
        this.getDirectoryRoles(),
        this.getUsers(['id', 'displayName', 'userPrincipalName', 'accountEnabled', 'signInActivity'])
      ]);

      // Filter to admin roles only
      const adminRoles = roles.filter(role => 
        role.displayName?.includes('Administrator') || 
        role.displayName?.includes('Admin') ||
        role.roleTemplateId === '62e90394-69f5-4237-9190-012177145e10' // Global Admin
      );

      // Get members for each admin role
      const adminUsersMap = new Map<string, { user: User; roles: DirectoryRole[] }>();

      for (const role of adminRoles) {
        try {
          const members = await this.getDirectoryRoleMembers(role.id!);
          members.forEach(member => {
            const existing = adminUsersMap.get(member.id!);
            if (existing) {
              existing.roles.push(role);
            } else {
              adminUsersMap.set(member.id!, { user: member, roles: [role] });
            }
          });
        } catch (error) {
          console.warn(`Failed to get members for role ${role.displayName}:`, error);
        }
      }

      return Array.from(adminUsersMap.values());
    } catch (error) {
      console.error('Failed to get administrative users:', error);
      this.handleGraphError(error);
    }
  }

  // ====== UTILITY METHODS ======

  /**
   * Test Graph API connectivity
   */
  async testConnection(): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const client = await this.initializeGraphClient(['User.Read']);
      const user = await client.api('/me').get();
      return { success: true, user };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Clear the Graph client (useful for re-authentication)
   */
  clearClient(): void {
    this.graphClient = null;
  }
}

// Singleton instance
let graphServiceInstance: GraphApiService | null = null;

export const createGraphService = (msalInstance: PublicClientApplication): GraphApiService => {
  if (!graphServiceInstance) {
    graphServiceInstance = new GraphApiService(msalInstance);
  }
  return graphServiceInstance;
};

export default GraphApiService;