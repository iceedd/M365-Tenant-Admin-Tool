import { createBrowserAuthService } from './authServiceBrowser';
import type { User, Group, SubscribedSku, DirectoryAudit } from '@microsoft/microsoft-graph-types';

/**
 * Data service for Microsoft Graph API integration
 * Requires authentication and proper Graph API permissions
 */
export class DataService {
  private authService: ReturnType<typeof createBrowserAuthService> | null = null;
  private useRealApi: boolean = false;

  constructor() {
    try {
      this.authService = createBrowserAuthService();
      this.useRealApi = true;
      console.log('🔄 DataService: Authentication service initialized successfully');
    } catch (error) {
      console.error('❌ DataService: Graph API initialization failed:', error);
      this.useRealApi = false;
    }
  }

  private async checkAuthentication(): Promise<boolean> {
    if (!this.authService) {
      console.log('❌ DataService: No auth service available');
      return false;
    }
    
    try {
      const isAuth = await this.authService.isAuthenticated();
      console.log(`🔐 DataService: Authentication check result: ${isAuth}`);
      return isAuth;
    } catch (error) {
      console.error('❌ DataService: Authentication check failed:', error);
      return false;
    }
  }

  // ====== USER MANAGEMENT ======

  async getUsers(): Promise<User[]>;
  async getUsers(select: string[]): Promise<User[]>;
  async getUsers(select?: string[]): Promise<User[]> {
    console.log(`📊 DataService.getUsers: useRealApi=${this.useRealApi}`);
    
    if (this.useRealApi && await this.checkAuthentication()) {
      try {
        console.log('🔄 DataService.getUsers: Fetching real users from Graph API...');
        const graphService = this.authService!.getGraphService();
        
        // Use provided select fields or default comprehensive set
        const selectFields = select || [
          'id', 'displayName', 'userPrincipalName', 'mail', 
          'jobTitle', 'department', 'officeLocation', 'assignedLicenses', 'accountEnabled', 'userType'
        ];
        
        const users = await graphService.getUsers(selectFields);
        console.log(`✅ DataService.getUsers: Successfully fetched ${users.length} real users`);
        return users;
      } catch (error) {
        console.error('❌ DataService.getUsers: Failed to fetch real users:', error);
        throw new Error('Failed to fetch users. Please ensure you are authenticated and have proper permissions.');
      }
    }

    throw new Error('Authentication service not available. Please configure Azure AD integration.');
  }

  async createUser(userData: {
    displayName: string;
    userPrincipalName: string;
    password: string;
    jobTitle?: string;
    department?: string;
    officeLocation?: string;
  }): Promise<User> {
    if (this.useRealApi && await this.checkAuthentication()) {
      try {
        const graphService = this.authService!.getGraphService();
        return await graphService.createUser({
          displayName: userData.displayName,
          userPrincipalName: userData.userPrincipalName,
          mailNickname: userData.userPrincipalName.split('@')[0],
          passwordProfile: {
            forceChangePasswordNextSignIn: true,
            password: userData.password
          },
          accountEnabled: true,
          jobTitle: userData.jobTitle,
          department: userData.department,
          officeLocation: userData.officeLocation,
          usageLocation: 'US' // Default to US, should be configurable
        });
      } catch (error) {
        console.error('Failed to create real user:', error);
        throw error;
      }
    }

    throw new Error('Authentication service not available. Please configure Azure AD integration.');
  }

  async checkUsernameAvailability(userPrincipalName: string): Promise<{ available: boolean; suggestions?: string[] }> {
    if (this.useRealApi && await this.checkAuthentication()) {
      try {
        const graphService = this.authService!.getGraphService();
        return await graphService.checkUsernameAvailability(userPrincipalName);
      } catch (error) {
        console.error('Failed to check username availability:', error);
        throw error;
      }
    }
    
    throw new Error('Authentication service not available. Please configure Azure AD integration.');
  }

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
  ): Promise<{ successful: any[]; failed: Array<{ user: any; error: string }> }> {
    console.log(`🔍 DataService.createUsersBulk: Called with ${users.length} users`);
    console.log(`🔍 DataService.createUsersBulk: useRealApi=${this.useRealApi}, authService=${!!this.authService}`);
    
    if (this.useRealApi && await this.checkAuthentication()) {
      try {
        console.log(`🚀 DataService.createUsersBulk: Starting bulk creation of ${users.length} users`);
        console.log(`📝 DataService.createUsersBulk: Users to create:`, users.map(u => `${u.displayName} (${u.userPrincipalName})`));
        
        const graphService = this.authService!.getGraphService();
        console.log(`🔍 DataService.createUsersBulk: GraphService obtained, calling createUsersBulk...`);
        
        const result = await graphService.createUsersBulk(users, onProgress);
        console.log(`✅ DataService.createUsersBulk: Completed. ${result.successful.length} successful, ${result.failed.length} failed`);
        return result;
      } catch (error) {
        console.error('❌ DataService.createUsersBulk: Failed:', error);
        throw error;
      }
    } else {
      const authCheck = await this.checkAuthentication();
      console.error('❌ DataService.createUsersBulk: Authentication failed', {
        useRealApi: this.useRealApi,
        authServiceAvailable: !!this.authService,
        authenticationResult: authCheck
      });
    }
    
    throw new Error('Authentication service not available. Please configure Azure AD integration.');
  }

  async updateUser(userId: string, updates: Partial<any>): Promise<void> {
    if (this.useRealApi && await this.checkAuthentication()) {
      try {
        const graphService = this.authService!.getGraphService();
        await graphService.updateUser(userId, updates);
      } catch (error) {
        console.error('Failed to update real user:', error);
        throw error;
      }
    } else {
      throw new Error('Authentication service not available. Please configure Azure AD integration.');
    }
  }

  async deleteUser(userId: string): Promise<void> {
    if (this.useRealApi && await this.checkAuthentication()) {
      try {
        const graphService = this.authService!.getGraphService();
        await graphService.deleteUser(userId);
      } catch (error) {
        console.error('Failed to delete real user:', error);
        throw error;
      }
    } else {
      throw new Error('Authentication service not available. Please configure Azure AD integration.');
    }
  }

  // ====== GROUP MANAGEMENT ======

  async getGroups(): Promise<Group[]> {
    if (this.useRealApi && await this.checkAuthentication()) {
      try {
        const graphService = this.authService!.getGraphService();
        return await graphService.getGroups([
          'id', 'displayName', 'description', 'groupTypes', 
          'mail', 'mailEnabled', 'securityEnabled'
        ]);
      } catch (error) {
        console.error('❌ Failed to fetch groups from Graph API:', error);
        throw new Error('Failed to fetch groups. Please ensure you are authenticated and have proper permissions.');
      }
    }

    throw new Error('Graph API service not available. Please configure Azure AD integration.');
  }

  async createGroup(groupData: {
    displayName: string;
    description?: string;
    groupType: 'Distribution' | 'Security' | 'Microsoft365';
  }): Promise<Group> {
    if (this.useRealApi && await this.checkAuthentication()) {
      try {
        const graphService = this.authService!.getGraphService();
        
        const groupTypes: string[] = groupData.groupType === 'Microsoft365' ? ['Unified'] : [];
        const mailEnabled = groupData.groupType !== 'Security';
        const securityEnabled = groupData.groupType === 'Security' || groupData.groupType === 'Microsoft365';
        
        // Generate a valid mail nickname (alphanumeric only, no spaces)
        const mailNickname = groupData.displayName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .substring(0, 20) || 'group' + Date.now().toString().substring(-8);

        // Prepare group creation payload - only include description if it has a meaningful value
        const groupPayload: any = {
          displayName: groupData.displayName,
          groupTypes,
          mailEnabled,
          mailNickname,
          securityEnabled
        };

        // Only add description if it exists and is not empty after trimming
        if (groupData.description && groupData.description.trim()) {
          const sanitizedDescription = groupData.description
            .replace(/[\r\n\t]/g, ' ')  // Replace line breaks and tabs with spaces
            .replace(/[<>]/g, '')       // Remove angle brackets which can cause issues
            .trim();
          
          // Only add if still has content after sanitization
          if (sanitizedDescription) {
            groupPayload.description = sanitizedDescription;
          }
        }

        return await graphService.createGroup(groupPayload);
      } catch (error) {
        console.error('Failed to create real group:', error);
        throw error;
      }
    }

    throw new Error('Graph API service not available. Please configure Azure AD integration.');
  }

  async getGroupMembers(groupId: string): Promise<User[]> {
    if (this.useRealApi && await this.checkAuthentication()) {
      try {
        console.log(`🔄 DataService.getGroupMembers: Fetching members for group ${groupId}`);
        const graphService = this.authService!.getGraphService();
        const members = await graphService.getGroupMembers(groupId);
        console.log(`✅ DataService.getGroupMembers: Found ${members.length} members for group ${groupId}`);
        return members;
      } catch (error) {
        console.error(`❌ DataService.getGroupMembers: Failed to fetch members for group ${groupId}:`, error);
        // Return empty array for real API failures - let the UI handle the empty state
        return [];
      }
    }

    // If not using real API, return empty array
    console.log('⚠️ DataService.getGroupMembers: Real API not available, returning empty array');
    return [];
  }

  async getGroupOwners(groupId: string): Promise<User[]> {
    if (this.useRealApi && await this.checkAuthentication()) {
      try {
        console.log(`🔄 DataService.getGroupOwners: Fetching owners for group ${groupId}`);
        const graphService = this.authService!.getGraphService();
        const owners = await graphService.getGroupOwners(groupId);
        console.log(`✅ DataService.getGroupOwners: Found ${owners.length} owners for group ${groupId}`);
        return owners;
      } catch (error) {
        console.error(`❌ DataService.getGroupOwners: Failed to fetch owners for group ${groupId}:`, error);
        // Return empty array for real API failures - let the UI handle the empty state
        return [];
      }
    }

    // If not using real API, return empty array
    console.log('⚠️ DataService.getGroupOwners: Real API not available, returning empty array');
    return [];
  }

  async addGroupMember(groupId: string, userId: string): Promise<void> {
    if (this.useRealApi && await this.checkAuthentication()) {
      try {
        const graphService = this.authService!.getGraphService();
        await graphService.addGroupMember(groupId, userId);
        console.log(`✅ Successfully added user ${userId} to group ${groupId}`);
      } catch (error) {
        console.error('❌ Failed to add group member:', error);
        throw error;
      }
    } else {
      throw new Error('Graph API service not available. Please configure Azure AD integration.');
    }
  }

  async updateGroup(groupId: string, updates: any): Promise<Group> {
    if (this.useRealApi && await this.checkAuthentication()) {
      try {
        const graphService = this.authService!.getGraphService();
        await graphService.updateGroup(groupId, updates);
        console.log(`✅ Successfully updated group ${groupId}`);
        
        // Return the updated group
        const updatedGroups = await graphService.getGroups(['id', 'displayName', 'description', 'groupTypes', 'mail', 'mailEnabled', 'securityEnabled']);
        const updatedGroup = updatedGroups.find(g => g.id === groupId);
        return updatedGroup || {} as Group;
      } catch (error) {
        console.error('❌ Failed to update group:', error);
        throw error;
      }
    } else {
      throw new Error('Graph API service not available. Please configure Azure AD integration.');
    }
  }

  // ====== LICENSE MANAGEMENT ======

  async getSubscribedSkus(): Promise<SubscribedSku[]> {
    if (this.useRealApi && await this.checkAuthentication()) {
      try {
        const graphService = this.authService!.getGraphService();
        return await graphService.getSubscribedSkus();
      } catch (error) {
        console.error('❌ Failed to fetch SKUs from Graph API:', error);
        throw new Error('Failed to fetch subscribed SKUs. Please ensure you are authenticated and have proper permissions.');
      }
    }

    throw new Error('Graph API service not available. Please configure Azure AD integration.');
  }

  async assignLicense(userId: string, skuId: string): Promise<void> {
    if (this.useRealApi && await this.checkAuthentication()) {
      try {
        const graphService = this.authService!.getGraphService();
        await graphService.assignLicense(userId, skuId);
        return;
      } catch (error) {
        console.error('Failed to assign real license:', error);
        throw error;
      }
    }

    throw new Error('Graph API service not available. Please configure Azure AD integration.');
  }

  async removeLicense(userId: string, skuId: string): Promise<void> {
    if (this.useRealApi && await this.checkAuthentication()) {
      try {
        const graphService = this.authService!.getGraphService();
        await graphService.removeLicense(userId, skuId);
        return;
      } catch (error) {
        console.error('Failed to remove real license:', error);
        throw error;
      }
    }

    throw new Error('Graph API service not available. Please configure Azure AD integration.');
  }

  // ====== DIRECTORY ROLES ======

  async getAdministrativeUsers(): Promise<{ user: any; roles: string[] }[]> {
    if (this.useRealApi && await this.checkAuthentication()) {
      try {
        console.log('🔄 DataService.getAdministrativeUsers: Fetching real admin users from Graph API...');
        const graphService = this.authService!.getGraphService();
        const adminUsers = await graphService.getAdministrativeUsers();
        
        // Transform to match the expected format
        const transformedAdminUsers = adminUsers.map(item => ({
          user: item.user,
          roles: item.roles.map(role => role.displayName || 'Unknown Role')
        }));
        
        console.log(`✅ DataService.getAdministrativeUsers: Successfully fetched ${transformedAdminUsers.length} admin users`);
        return transformedAdminUsers;
      } catch (error) {
        console.error('❌ DataService.getAdministrativeUsers: Failed to fetch real admin users:', error);
        throw new Error('Failed to fetch administrative users. Please ensure you have proper permissions.');
      }
    }

    throw new Error('Authentication service not available. Please configure Azure AD integration.');
  }

  // ====== AUDIT LOGS ======

  async getAuditLogs(days: number = 30): Promise<DirectoryAudit[]> {
    if (this.useRealApi && await this.checkAuthentication()) {
      try {
        const graphService = this.authService!.getGraphService();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        const filter = `activityDateTime ge ${startDate.toISOString()}`;
        return await graphService.getAuditLogs(filter, 100);
      } catch (error) {
        console.error('❌ Failed to fetch audit logs from Graph API:', error);
        throw new Error('Failed to fetch audit logs. Please ensure you are authenticated and have proper permissions.');
      }
    }

    throw new Error('Graph API service not available. Please configure Azure AD integration.');
  }

  // ====== ORGANIZATION INFO ======

  async getOrganizationInfo(): Promise<any> {
    if (this.useRealApi && await this.checkAuthentication()) {
      try {
        const graphService = this.authService!.getGraphService();
        const organizations = await graphService.getOrganization();
        return organizations[0] || null;
      } catch (error) {
        console.error('❌ Failed to fetch organization info from Graph API:', error);
        throw new Error('Failed to fetch organization information. Please ensure you are authenticated and have proper permissions.');
      }
    }

    throw new Error('Graph API service not available. Please configure Azure AD integration.');
  }

  // ====== UTILITY METHODS ======

  isUsingRealApi(): boolean {
    return this.useRealApi;
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.useRealApi) {
      return { success: false, message: 'Azure AD integration not configured. Please configure authentication.' };
    }

    try {
      if (!await this.checkAuthentication()) {
        return { success: false, message: 'Not authenticated' };
      }

      const graphService = this.authService!.getGraphService();
      const result = await graphService.testConnection();
      
      return { 
        success: result.success, 
        message: result.success ? 'Connected to Microsoft Graph' : result.error || 'Connection failed'
      };
    } catch (error) {
      return { success: false, message: `Connection test failed: ${error}` };
    }
  }
}

// Singleton instance
let dataServiceInstance: DataService | null = null;

export const getDataService = (): DataService => {
  if (!dataServiceInstance) {
    dataServiceInstance = new DataService();
  }
  return dataServiceInstance;
};

export default DataService;