import { createBrowserAuthService } from './authServiceBrowser';
import type { User, Group, SubscribedSku, DirectoryAudit } from '@microsoft/microsoft-graph-types';

/**
 * Data service that can switch between mock data and real Graph API calls
 * based on authentication status and configuration
 */
export class DataService {
  private authService: ReturnType<typeof createBrowserAuthService> | null = null;
  private useRealApi: boolean = false;

  constructor() {
    try {
      this.authService = createBrowserAuthService();
      this.useRealApi = true;
    } catch (error) {
      console.warn('Graph API not available, using mock data:', error);
      this.useRealApi = false;
    }
  }

  private async checkAuthentication(): Promise<boolean> {
    if (!this.authService) return false;
    
    try {
      return await this.authService.isAuthenticated();
    } catch (error) {
      console.error('Authentication check failed:', error);
      return false;
    }
  }

  // ====== USER MANAGEMENT ======

  async getUsers(): Promise<User[]> {
    if (this.useRealApi && await this.checkAuthentication()) {
      try {
        const graphService = this.authService!.getGraphService();
        return await graphService.getUsers([
          'id', 'displayName', 'userPrincipalName', 'mail', 
          'jobTitle', 'department', 'officeLocation', 'assignedLicenses'
        ]);
      } catch (error) {
        console.error('Failed to fetch real users, falling back to mock data:', error);
      }
    }

    // Mock data fallback
    return [
      {
        id: '1',
        displayName: 'John Smith',
        userPrincipalName: 'john.smith@contoso.com',
        mail: 'john.smith@contoso.com',
        jobTitle: 'Software Engineer',
        department: 'IT',
        officeLocation: 'Seattle',
        assignedLicenses: []
      },
      {
        id: '2', 
        displayName: 'Sarah Wilson',
        userPrincipalName: 'sarah.wilson@contoso.com',
        mail: 'sarah.wilson@contoso.com',
        jobTitle: 'Administrator',
        department: 'IT',
        officeLocation: 'New York',
        assignedLicenses: []
      },
      {
        id: '3',
        displayName: 'Mike Johnson', 
        userPrincipalName: 'mike.johnson@contoso.com',
        mail: 'mike.johnson@contoso.com',
        jobTitle: 'Manager',
        department: 'Sales',
        officeLocation: 'Los Angeles',
        assignedLicenses: []
      }
    ] as User[];
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

    // Mock creation
    console.log('Mock user creation:', userData);
    return {
      id: Date.now().toString(),
      displayName: userData.displayName,
      userPrincipalName: userData.userPrincipalName,
      mail: userData.userPrincipalName,
      jobTitle: userData.jobTitle,
      department: userData.department,
      officeLocation: userData.officeLocation
    } as User;
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
        console.error('Failed to fetch real groups, falling back to mock data:', error);
      }
    }

    // Mock data fallback
    return [
      {
        id: '1',
        displayName: 'All Employees',
        description: 'All company employees',
        groupTypes: [],
        mail: 'allemployees@contoso.com',
        mailEnabled: true,
        securityEnabled: false
      },
      {
        id: '2',
        displayName: 'IT Department',
        description: 'Information Technology team',
        groupTypes: [],
        mail: 'it@contoso.com', 
        mailEnabled: true,
        securityEnabled: true
      },
      {
        id: '3',
        displayName: 'Sales Team',
        description: 'Sales and marketing team',
        groupTypes: ['Unified'],
        mail: 'sales@contoso.com',
        mailEnabled: true,
        securityEnabled: false
      }
    ] as Group[];
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
        
        return await graphService.createGroup({
          displayName: groupData.displayName,
          description: groupData.description,
          groupTypes,
          mailEnabled,
          mailNickname: groupData.displayName.toLowerCase().replace(/\s+/g, ''),
          securityEnabled
        });
      } catch (error) {
        console.error('Failed to create real group:', error);
        throw error;
      }
    }

    // Mock creation
    console.log('Mock group creation:', groupData);
    return {
      id: Date.now().toString(),
      displayName: groupData.displayName,
      description: groupData.description,
      groupTypes: groupData.groupType === 'Microsoft365' ? ['Unified'] : [],
      mailEnabled: groupData.groupType !== 'Security',
      securityEnabled: groupData.groupType === 'Security' || groupData.groupType === 'Microsoft365'
    } as Group;
  }

  // ====== LICENSE MANAGEMENT ======

  async getSubscribedSkus(): Promise<SubscribedSku[]> {
    if (this.useRealApi && await this.checkAuthentication()) {
      try {
        const graphService = this.authService!.getGraphService();
        return await graphService.getSubscribedSkus();
      } catch (error) {
        console.error('Failed to fetch real SKUs, falling back to mock data:', error);
      }
    }

    // Mock data fallback
    return [
      {
        skuId: 'c7df2760-2c81-4ef7-b578-5b5392b571df',
        skuPartNumber: 'ENTERPRISEPACK',
        accountName: 'contoso',
        accountId: 'account-id',
        capabilityStatus: 'Enabled',
        consumedUnits: 445,
        prepaidUnits: {
          enabled: 500,
          suspended: 0,
          warning: 0
        }
      },
      {
        skuId: '6fd2c87f-b296-42f0-b197-1e91e994b900',
        skuPartNumber: 'ENTERPRISEPREMIUM',
        accountName: 'contoso',
        accountId: 'account-id', 
        capabilityStatus: 'Enabled',
        consumedUnits: 165,
        prepaidUnits: {
          enabled: 200,
          suspended: 0,
          warning: 0
        }
      }
    ] as SubscribedSku[];
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

    // Mock assignment
    console.log('Mock license assignment:', { userId, skuId });
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
        console.error('Failed to fetch real audit logs, falling back to mock data:', error);
      }
    }

    // Mock data fallback
    return [
      {
        id: '1',
        activityDateTime: new Date().toISOString(),
        activityDisplayName: 'Add user',
        category: 'UserManagement',
        result: 'success',
        initiatedBy: {
          user: {
            displayName: 'Sarah Wilson',
            userPrincipalName: 'sarah.wilson@contoso.com'
          }
        }
      },
      {
        id: '2',
        activityDateTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        activityDisplayName: 'Add group member',
        category: 'GroupManagement', 
        result: 'success',
        initiatedBy: {
          user: {
            displayName: 'Mike Johnson',
            userPrincipalName: 'mike.johnson@contoso.com'
          }
        }
      }
    ] as DirectoryAudit[];
  }

  // ====== ORGANIZATION INFO ======

  async getOrganizationInfo(): Promise<any> {
    if (this.useRealApi && await this.checkAuthentication()) {
      try {
        const graphService = this.authService!.getGraphService();
        const organizations = await graphService.getOrganization();
        return organizations[0] || null;
      } catch (error) {
        console.error('Failed to fetch real organization info, falling back to mock data:', error);
      }
    }

    // Mock data fallback
    return {
      id: 'org-id',
      displayName: 'Contoso Corporation',
      verifiedDomains: [
        { name: 'contoso.com', isDefault: true }
      ],
      assignedPlans: [],
      businessPhones: ['+1 (555) 123-4567'],
      city: 'Seattle',
      country: 'United States',
      countryLetterCode: 'US'
    };
  }

  // ====== UTILITY METHODS ======

  isUsingRealApi(): boolean {
    return this.useRealApi;
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.useRealApi) {
      return { success: false, message: 'Azure AD integration not configured - using mock data' };
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