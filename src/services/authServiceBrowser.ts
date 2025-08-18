import { PublicClientApplication, AccountInfo, AuthenticationResult } from '@azure/msal-browser';
import { msalConfig, loginRequest, validateAzureConfig } from '../config/azureConfig';
import { createGraphService, GraphApiService } from './graphApiService';
import type { User } from '@microsoft/microsoft-graph-types';

// Extended user interface with roles
export interface AuthUser extends User {
  roles?: string[];
  isAuthenticated: boolean;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export class BrowserAuthService {
  private msalInstance: PublicClientApplication;
  private graphService: GraphApiService;
  private initialized: boolean = false;

  constructor() {
    // Validate configuration before initializing
    const validation = validateAzureConfig();
    if (!validation.isValid) {
      console.error('Azure configuration errors:', validation.errors);
      throw new Error(`Azure AD configuration is invalid: ${validation.errors.join(', ')}`);
    }

    // Initialize MSAL
    this.msalInstance = new PublicClientApplication(msalConfig);
    this.graphService = createGraphService(this.msalInstance);
    
    // Initialize MSAL asynchronously
    this.initializeMsal();
  }

  private async initializeMsal(): Promise<void> {
    try {
      await this.msalInstance.initialize();
      
      // Handle redirect promise
      const response = await this.msalInstance.handleRedirectPromise();
      if (response) {
        console.log('Redirect authentication successful:', response.account?.username);
      }
      
      // Set active account if available
      const accounts = this.msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        this.msalInstance.setActiveAccount(accounts[0]);
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('MSAL initialization failed:', error);
      throw error;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initializeMsal();
    }
  }

  /**
   * Login with popup
   */
  async loginPopup(): Promise<AuthResponse> {
    try {
      await this.ensureInitialized();
      
      const response: AuthenticationResult = await this.msalInstance.loginPopup(loginRequest);
      
      // Set active account
      this.msalInstance.setActiveAccount(response.account);
      
      // Get user details from Graph API
      const connectionTest = await this.graphService.testConnection();
      if (!connectionTest.success) {
        throw new Error(`Graph API connection failed: ${connectionTest.error}`);
      }

      const authUser: AuthUser = {
        ...connectionTest.user!,
        roles: ['user'], // Default role, can be enhanced with directory roles
        isAuthenticated: true
      };

      return {
        user: authUser,
        token: response.accessToken
      };
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Login with redirect
   */
  async loginRedirect(): Promise<void> {
    try {
      await this.ensureInitialized();
      await this.msalInstance.loginRedirect(loginRequest);
    } catch (error) {
      console.error('Login redirect failed:', error);
      throw error;
    }
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      await this.ensureInitialized();
      
      const account = this.msalInstance.getActiveAccount();
      if (account) {
        await this.msalInstance.logoutPopup({
          account,
          postLogoutRedirectUri: msalConfig.auth.postLogoutRedirectUri
        });
      }
      
      // Clear Graph service client
      this.graphService.clearClient();
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      await this.ensureInitialized();
      
      const account = this.msalInstance.getActiveAccount();
      if (!account) {
        return null;
      }

      // Test Graph connection and get user details
      const connectionTest = await this.graphService.testConnection();
      if (!connectionTest.success) {
        console.error('Failed to get current user from Graph API:', connectionTest.error);
        return null;
      }

      return {
        ...connectionTest.user!,
        roles: ['user'], // Can be enhanced with actual directory roles
        isAuthenticated: true
      };
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      await this.ensureInitialized();
      const account = this.msalInstance.getActiveAccount();
      return account !== null;
    } catch (error) {
      console.error('Failed to check authentication status:', error);
      return false;
    }
  }

  /**
   * Get access token silently
   */
  async getAccessToken(scopes: string[] = ['User.Read']): Promise<string> {
    try {
      await this.ensureInitialized();
      
      const account = this.msalInstance.getActiveAccount();
      if (!account) {
        throw new Error('No active account found');
      }

      const response = await this.msalInstance.acquireTokenSilent({
        scopes,
        account
      });

      return response.accessToken;
    } catch (error) {
      console.error('Failed to acquire token silently:', error);
      
      // If silent token acquisition fails, try popup
      try {
        const response = await this.msalInstance.acquireTokenPopup({
          scopes,
          account: this.msalInstance.getActiveAccount()!
        });
        return response.accessToken;
      } catch (popupError) {
        console.error('Failed to acquire token via popup:', popupError);
        throw popupError;
      }
    }
  }

  /**
   * Get MSAL instance for advanced operations
   */
  getMsalInstance(): PublicClientApplication {
    return this.msalInstance;
  }

  /**
   * Get Graph service instance
   */
  getGraphService(): GraphApiService {
    return this.graphService;
  }

  /**
   * Get active account info
   */
  async getActiveAccount(): Promise<AccountInfo | null> {
    await this.ensureInitialized();
    return this.msalInstance.getActiveAccount();
  }
}

// Create singleton instance
let authServiceInstance: BrowserAuthService | null = null;

export const createBrowserAuthService = (): BrowserAuthService => {
  if (!authServiceInstance) {
    authServiceInstance = new BrowserAuthService();
  }
  return authServiceInstance;
};

// Legacy export for backward compatibility - updated to use browser auth
export const authService = {
  login: async (): Promise<AuthResponse> => {
    const service = createBrowserAuthService();
    return await service.loginPopup();
  },
  
  logout: async (): Promise<void> => {
    const service = createBrowserAuthService();
    return await service.logout();
  },
  
  getCurrentUser: async (): Promise<AuthUser | null> => {
    const service = createBrowserAuthService();
    return await service.getCurrentUser();
  },
  
  refreshToken: async (): Promise<string> => {
    const service = createBrowserAuthService();
    return await service.getAccessToken();
  }
};

export default BrowserAuthService;