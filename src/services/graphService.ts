import { Client } from '@microsoft/microsoft-graph-client';
import { AuthenticationProvider } from '@microsoft/microsoft-graph-client';
import { User, Group, License, GraphError } from '../types/index';
import logger, { logGraphApiCall, logError } from '../utils/logger';

/**
 * Custom authentication provider for Microsoft Graph client
 */
class CustomAuthProvider implements AuthenticationProvider {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async getAccessToken(): Promise<string> {
    return this.accessToken;
  }
}

/**
 * Microsoft Graph service for user provisioning operations
 */
export class GraphService {
  private client: Client;
  private userId?: string;

  constructor(accessToken: string, userId?: string) {
    const authProvider = new CustomAuthProvider(accessToken);
    this.client = Client.initWithMiddleware({ authProvider });
    this.userId = userId;
  }

  /**
   * Execute a Graph API call with logging and error handling
   */
  private async executeGraphCall<T>(
    operation: () => Promise<T>,
    method: string,
    endpoint: string
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      
      logGraphApiCall(method, endpoint, 200, duration, this.userId);
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const statusCode = error.code || error.status || 500;
      
      logGraphApiCall(method, endpoint, statusCode, duration, this.userId);
      logError(error, `Graph API call failed: ${method} ${endpoint}`, this.userId);
      
      throw this.handleGraphError(error);
    }
  }

  /**
   * Handle Graph API errors and convert to standardized format
   */
  private handleGraphError(error: any): GraphError {
    const graphError: GraphError = {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred'
    };

    if (error.body && error.body.error) {
      graphError.code = error.body.error.code;
      graphError.message = error.body.error.message;
      graphError.innerError = error.body.error.innerError;
    }

    return graphError;
  }

  // User management methods

  /**
   * Get all users with optional filtering
   */
  async getUsers(filter?: string, select?: string[], top?: number): Promise<User[]> {
    return this.executeGraphCall(async () => {
      let request = this.client.api('/users');
      
      if (filter) {
        request = request.filter(filter);
      }
      
      if (select && select.length > 0) {
        request = request.select(select.join(','));
      }
      
      if (top) {
        request = request.top(top);
      }

      const response = await request.get();
      return response.value || [];
    }, 'GET', '/users');
  }

  /**
   * Get a specific user by ID
   */
  async getUser(userId: string, select?: string[]): Promise<User> {
    return this.executeGraphCall(async () => {
      let request = this.client.api(`/users/${userId}`);
      
      if (select && select.length > 0) {
        request = request.select(select.join(','));
      }

      return await request.get();
    }, 'GET', `/users/${userId}`);
  }

  /**
   * Create a new user
   */
  async createUser(user: User): Promise<User> {
    return this.executeGraphCall(async () => {
      const response = await this.client.api('/users').post(user);
      logger.info(`User created successfully: ${response.userPrincipalName}`, {
        userId: this.userId,
        createdUserId: response.id
      });
      return response;
    }, 'POST', '/users');
  }

  /**
   * Update an existing user
   */
  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    return this.executeGraphCall(async () => {
      await this.client.api(`/users/${userId}`).patch(updates);
      logger.info(`User updated successfully: ${userId}`, {
        userId: this.userId,
        updatedUserId: userId,
        updates: Object.keys(updates)
      });
    }, 'PATCH', `/users/${userId}`);
  }

  /**
   * Delete a user
   */
  async deleteUser(userId: string): Promise<void> {
    return this.executeGraphCall(async () => {
      await this.client.api(`/users/${userId}`).delete();
      logger.info(`User deleted successfully: ${userId}`, {
        userId: this.userId,
        deletedUserId: userId
      });
    }, 'DELETE', `/users/${userId}`);
  }

  /**
   * Assign licenses to a user
   */
  async assignLicenses(userId: string, licenseSkuIds: string[]): Promise<void> {
    return this.executeGraphCall(async () => {
      const addLicenses = licenseSkuIds.map(skuId => ({ skuId }));
      
      await this.client.api(`/users/${userId}/assignLicense`).post({
        addLicenses,
        removeLicenses: []
      });
      
      logger.info(`Licenses assigned to user: ${userId}`, {
        userId: this.userId,
        targetUserId: userId,
        licenses: licenseSkuIds
      });
    }, 'POST', `/users/${userId}/assignLicense`);
  }

  /**
   * Remove licenses from a user
   */
  async removeLicenses(userId: string, licenseSkuIds: string[]): Promise<void> {
    return this.executeGraphCall(async () => {
      await this.client.api(`/users/${userId}/assignLicense`).post({
        addLicenses: [],
        removeLicenses: licenseSkuIds
      });
      
      logger.info(`Licenses removed from user: ${userId}`, {
        userId: this.userId,
        targetUserId: userId,
        licenses: licenseSkuIds
      });
    }, 'POST', `/users/${userId}/assignLicense`);
  }

  // Group management methods

  /**
   * Get all groups with optional filtering
   */
  async getGroups(filter?: string, select?: string[], top?: number): Promise<Group[]> {
    return this.executeGraphCall(async () => {
      let request = this.client.api('/groups');
      
      if (filter) {
        request = request.filter(filter);
      }
      
      if (select && select.length > 0) {
        request = request.select(select.join(','));
      }
      
      if (top) {
        request = request.top(top);
      }

      const response = await request.get();
      return response.value || [];
    }, 'GET', '/groups');
  }

  /**
   * Get a specific group by ID
   */
  async getGroup(groupId: string): Promise<Group> {
    return this.executeGraphCall(async () => {
      return await this.client.api(`/groups/${groupId}`).get();
    }, 'GET', `/groups/${groupId}`);
  }

  /**
   * Create a new group
   */
  async createGroup(group: Group): Promise<Group> {
    return this.executeGraphCall(async () => {
      const response = await this.client.api('/groups').post(group);
      logger.info(`Group created successfully: ${response.displayName}`, {
        userId: this.userId,
        createdGroupId: response.id
      });
      return response;
    }, 'POST', '/groups');
  }

  /**
   * Add members to a group
   */
  async addGroupMembers(groupId: string, memberIds: string[]): Promise<void> {
    return this.executeGraphCall(async () => {
      for (const memberId of memberIds) {
        const memberRef = {
          '@odata.id': `https://graph.microsoft.com/v1.0/users/${memberId}`
        };
        
        await this.client.api(`/groups/${groupId}/members/$ref`).post(memberRef);
      }
      
      logger.info(`Members added to group: ${groupId}`, {
        userId: this.userId,
        groupId,
        memberIds
      });
    }, 'POST', `/groups/${groupId}/members/$ref`);
  }

  /**
   * Remove member from a group
   */
  async removeGroupMember(groupId: string, memberId: string): Promise<void> {
    return this.executeGraphCall(async () => {
      await this.client.api(`/groups/${groupId}/members/${memberId}/$ref`).delete();
      
      logger.info(`Member removed from group: ${groupId}`, {
        userId: this.userId,
        groupId,
        memberId
      });
    }, 'DELETE', `/groups/${groupId}/members/${memberId}/$ref`);
  }

  // License management methods

  /**
   * Get available licenses in the organization
   */
  async getLicenses(): Promise<License[]> {
    return this.executeGraphCall(async () => {
      const response = await this.client.api('/subscribedSkus').get();
      return response.value || [];
    }, 'GET', '/subscribedSkus');
  }

  /**
   * Get user's assigned licenses
   */
  async getUserLicenses(userId: string): Promise<any[]> {
    return this.executeGraphCall(async () => {
      const user = await this.client.api(`/users/${userId}`)
        .select('assignedLicenses')
        .get();
      
      return user.assignedLicenses || [];
    }, 'GET', `/users/${userId}?$select=assignedLicenses`);
  }

  // Batch operations

  /**
   * Create multiple users in batch
   */
  async createUsersBatch(users: User[]): Promise<any[]> {
    return this.executeGraphCall(async () => {
      const batch = this.client.api('/$batch');
      
      const requests = users.map((user, index) => ({
        id: (index + 1).toString(),
        method: 'POST',
        url: '/users',
        body: user,
        headers: {
          'Content-Type': 'application/json'
        }
      }));

      const batchRequest = { requests };
      const response = await batch.post(batchRequest);
      
      logger.info(`Batch user creation completed`, {
        userId: this.userId,
        batchSize: users.length,
        responses: response.responses?.length || 0
      });
      
      return response.responses || [];
    }, 'POST', '/$batch');
  }

  /**
   * Get current user's profile
   */
  async getMe(): Promise<User> {
    return this.executeGraphCall(async () => {
      return await this.client.api('/me').get();
    }, 'GET', '/me');
  }
}

export default GraphService;