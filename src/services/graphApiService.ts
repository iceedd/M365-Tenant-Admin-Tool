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
      const response = await client.api(`/groups/${groupId}/members`).get();
      return response.value || [];
    } catch (error) {
      this.handleGraphError(error);
    }
  }

  /**
   * Get group owners
   */
  async getGroupOwners(groupId: string): Promise<User[]> {
    try {
      const client = await this.initializeGraphClient(graphScopes.groups);
      const response = await client.api(`/groups/${groupId}/owners`).get();
      return response.value || [];
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