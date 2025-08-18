import { ConfidentialClientApplication, AuthenticationResult } from '@azure/msal-node';
import { config } from '@/config';
import { AuthUser } from '@/types';
import logger, { logSecurityEvent, logError } from '@/utils/logger';
import jwt from 'jsonwebtoken';

/**
 * Azure AD/Entra ID authentication service using MSAL
 */
export class AuthService {
  private msalInstance: ConfidentialClientApplication;

  constructor() {
    this.msalInstance = new ConfidentialClientApplication({
      auth: {
        clientId: config.azure.clientId,
        clientSecret: config.azure.clientSecret,
        authority: `https://login.microsoftonline.com/${config.azure.tenantId}`
      },
      system: {
        loggerOptions: {
          loggerCallback: (level, message, containsPii) => {
            if (containsPii) return;
            
            switch (level) {
              case 1: // Error
                logger.error('MSAL Error', { message });
                break;
              case 2: // Warning
                logger.warn('MSAL Warning', { message });
                break;
              case 3: // Info
                logger.info('MSAL Info', { message });
                break;
              case 4: // Verbose
                logger.debug('MSAL Verbose', { message });
                break;
            }
          },
          piiLoggingEnabled: false,
          logLevel: 3 // Info level
        }
      }
    });
  }

  /**
   * Get authorization URL for OAuth flow
   */
  getAuthUrl(state?: string): string {
    const authUrlParameters = {
      scopes: config.graph.scopes,
      redirectUri: config.azure.redirectUri,
      state: state || this.generateState()
    };

    return this.msalInstance.getAuthCodeUrl(authUrlParameters);
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(
    code: string, 
    state?: string,
    ipAddress?: string
  ): Promise<AuthUser> {
    try {
      const tokenRequest = {
        code,
        scopes: config.graph.scopes,
        redirectUri: config.azure.redirectUri
      };

      const response: AuthenticationResult = await this.msalInstance.acquireTokenByCode(tokenRequest);
      
      if (!response.account || !response.accessToken) {
        throw new Error('Failed to acquire tokens - missing account or access token');
      }

      const authUser: AuthUser = {
        id: response.account.homeAccountId,
        displayName: response.account.name || '',
        userPrincipalName: response.account.username,
        roles: [], // Will be populated from Graph API call
        accessToken: response.accessToken,
        refreshToken: response.refreshToken || undefined,
        expiresOn: response.expiresOn || new Date(Date.now() + 3600000) // 1 hour default
      };

      logSecurityEvent('user_login_success', authUser.id, ipAddress, {
        userPrincipalName: authUser.userPrincipalName
      });

      return authUser;
    } catch (error: any) {
      logSecurityEvent('user_login_failed', undefined, ipAddress, {
        error: error.message,
        code
      });
      
      logError(error, 'Token exchange failed');
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string, userId: string): Promise<AuthUser> {
    try {
      const silentRequest = {
        refreshToken,
        scopes: config.graph.scopes
      };

      const response: AuthenticationResult = await this.msalInstance.acquireTokenByRefreshToken(silentRequest);
      
      if (!response.account || !response.accessToken) {
        throw new Error('Failed to refresh token - missing account or access token');
      }

      const authUser: AuthUser = {
        id: response.account.homeAccountId,
        displayName: response.account.name || '',
        userPrincipalName: response.account.username,
        roles: [], // Will be populated from Graph API call
        accessToken: response.accessToken,
        refreshToken: response.refreshToken || refreshToken,
        expiresOn: response.expiresOn || new Date(Date.now() + 3600000)
      };

      logger.info('Access token refreshed successfully', {
        userId: authUser.id
      });

      return authUser;
    } catch (error: any) {
      logError(error, 'Token refresh failed', userId);
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  /**
   * Generate JWT token for session management
   */
  generateJWT(authUser: AuthUser): string {
    const payload = {
      userId: authUser.id,
      userPrincipalName: authUser.userPrincipalName,
      displayName: authUser.displayName,
      roles: authUser.roles,
      expiresOn: authUser.expiresOn
    };

    return jwt.sign(payload, config.security.jwtSecret, {
      expiresIn: '1h',
      issuer: 'M365-UserProvisioning-Tool',
      subject: authUser.id
    });
  }

  /**
   * Verify and decode JWT token
   */
  verifyJWT(token: string): any {
    try {
      return jwt.verify(token, config.security.jwtSecret, {
        issuer: 'M365-UserProvisioning-Tool'
      });
    } catch (error: any) {
      logError(error, 'JWT verification failed');
      throw new Error(`Invalid token: ${error.message}`);
    }
  }

  /**
   * Check if access token is expired or close to expiring
   */
  isTokenExpired(expiresOn: Date, bufferMinutes: number = 5): boolean {
    const bufferMs = bufferMinutes * 60 * 1000;
    const expiryTime = new Date(expiresOn).getTime();
    const currentTime = Date.now();
    
    return currentTime >= (expiryTime - bufferMs);
  }

  /**
   * Logout user and revoke tokens
   */
  async logout(userId: string, ipAddress?: string): Promise<void> {
    try {
      // Note: MSAL doesn't provide a direct logout method for confidential clients
      // In a production environment, you might want to maintain a token blacklist
      // or call the Microsoft logout endpoint
      
      logSecurityEvent('user_logout', userId, ipAddress);
      
      logger.info('User logged out successfully', {
        userId
      });
    } catch (error: any) {
      logError(error, 'Logout failed', userId);
      throw new Error(`Logout failed: ${error.message}`);
    }
  }

  /**
   * Generate a secure random state parameter for OAuth flow
   */
  private generateState(): string {
    return Buffer.from(
      Math.random().toString(36).substring(2, 15) + 
      Math.random().toString(36).substring(2, 15) +
      Date.now().toString()
    ).toString('base64');
  }

  /**
   * Validate OAuth state parameter
   */
  validateState(receivedState: string, expectedState: string): boolean {
    return receivedState === expectedState;
  }

  /**
   * Extract user roles from Microsoft Graph (to be called after authentication)
   */
  async getUserRoles(accessToken: string): Promise<string[]> {
    try {
      // This would typically involve calling Graph API to get user's directory roles
      // For now, returning empty array - implement based on your role requirements
      const roles: string[] = [];
      
      // Example: Check if user is in specific groups or has directory roles
      // const graphService = new GraphService(accessToken);
      // const userGroups = await graphService.getUserGroups();
      // roles = this.mapGroupsToRoles(userGroups);
      
      return roles;
    } catch (error: any) {
      logError(error, 'Failed to retrieve user roles');
      return []; // Return empty array instead of throwing
    }
  }

  /**
   * Check if user has required permissions
   */
  hasPermission(userRoles: string[], requiredRole: string): boolean {
    return userRoles.includes(requiredRole) || userRoles.includes('admin');
  }

  /**
   * Check if user has any of the required permissions
   */
  hasAnyPermission(userRoles: string[], requiredRoles: string[]): boolean {
    return requiredRoles.some(role => this.hasPermission(userRoles, role));
  }
}

export default AuthService;