import { Router, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse } from '../types/index';
import { PublicClientApplication } from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';
import { config } from '../config/index';
import logger from '../utils/logger';
import { randomBytes } from 'crypto';
import { createHash } from 'crypto';

const router = Router();

/**
 * Secure route to get real Graph API data using user authentication
 * This approach is secure for public hosting - no client secrets needed!
 */

// Create MSAL public client instance (no secret required)
const msalInstance = new PublicClientApplication({
  auth: {
    clientId: config.azureAd.clientId,
    authority: `https://login.microsoftonline.com/${config.azureAd.tenantId}`,
  }
});

/**
 * Helper to create Graph client from user token
 */
function createGraphClient(accessToken: string): Client {
  return Client.init({
    authProvider: {
      getAccessToken: async () => accessToken
    }
  });
}

/**
 * POST /secure-data/get-auth-url
 * Get the authentication URL for user to sign in
 */
router.post('/get-auth-url', asyncHandler(async (req: any, res: Response) => {
  try {
    const scopes = [
      'User.Read',
      'User.Read.All', 
      'Group.Read.All',
      'Directory.Read.All',
      'AuditLog.Read.All'
    ];

    // Generate PKCE challenge for security
    const { codeChallenge, codeVerifier } = await msalInstance.cryptoProvider.generatePkceCodes();

    const authUrlParameters = {
      scopes,
      redirectUri: config.azureAd.redirectUri, // Use configured redirect URI
      responseMode: 'query' as const,
      state: Math.random().toString(36).substring(7), // Generate random state
      codeChallenge,
      codeChallengeMethod: 'S256' as const
    };

    const authUrl = await msalInstance.getAuthCodeUrl(authUrlParameters);
    
    const response: ApiResponse = {
      success: true,
      data: {
        authUrl,
        state: authUrlParameters.state,
        codeVerifier, // Need this for token exchange
        scopes
      },
      message: 'Authentication URL generated successfully'
    };
    
    res.json(response);
  } catch (error: any) {
    logger.error('Error generating auth URL:', error);
    res.status(500).json({
      success: false,
      error: 'AUTH_URL_ERROR',
      message: `Failed to generate auth URL: ${error.message}`
    });
  }
}));

/**
 * POST /secure-data/exchange-token
 * Exchange authorization code for access token (called from frontend after user auth)
 */
router.post('/exchange-token', asyncHandler(async (req: any, res: Response) => {
  try {
    const { code, state, codeVerifier } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_CODE',
        message: 'Authorization code is required'
      });
    }

    if (!codeVerifier) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_CODE_VERIFIER',
        message: 'PKCE code verifier is required'
      });
    }

    const tokenRequest = {
      code,
      scopes: [
        'User.Read',
        'User.Read.All',
        'Group.Read.All', 
        'Directory.Read.All',
        'AuditLog.Read.All'
      ],
      redirectUri: config.azureAd.redirectUri,
      codeVerifier // PKCE code verifier for security
    };

    const tokenResponse = await msalInstance.acquireTokenByCode(tokenRequest);
    
    if (!tokenResponse?.accessToken) {
      throw new Error('Failed to acquire access token');
    }

    const response: ApiResponse = {
      success: true,
      data: {
        accessToken: tokenResponse.accessToken,
        expiresOn: tokenResponse.expiresOn,
        account: tokenResponse.account
      },
      message: 'Token exchanged successfully'
    };
    
    res.json(response);
  } catch (error: any) {
    logger.error('Error exchanging token:', error);
    res.status(500).json({
      success: false,
      error: 'TOKEN_EXCHANGE_ERROR',
      message: `Failed to exchange token: ${error.message}`
    });
  }
}));

/**
 * POST /secure-data/licenses
 * Get real license data using user's access token
 */
router.post('/licenses', asyncHandler(async (req: any, res: Response) => {
  try {
    const { accessToken } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_TOKEN',
        message: 'Access token is required'
      });
    }

    const graphClient = createGraphClient(accessToken);
    
    // Get subscribed SKUs (licenses) from tenant
    const response = await graphClient.api('/subscribedSkus').get();
    const licenses = response.value || [];
    
    logger.info(`Retrieved ${licenses.length} licenses from tenant via user auth`);
    
    const apiResponse: ApiResponse = {
      success: true,
      data: licenses,
      message: `Retrieved ${licenses.length} licenses from your tenant`
    };
    
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Error fetching license data with user token:', error);
    res.status(500).json({
      success: false,
      error: 'GRAPH_API_ERROR',
      message: `Failed to fetch license data: ${error.message}`,
      details: error.code || error.message
    });
  }
}));

/**
 * POST /secure-data/users
 * Get real user data using user's access token
 */
router.post('/users', asyncHandler(async (req: any, res: Response) => {
  try {
    const { accessToken } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_TOKEN',
        message: 'Access token is required'
      });
    }

    const graphClient = createGraphClient(accessToken);
    
    const response = await graphClient
      .api('/users')
      .select('id,displayName,userPrincipalName,mail,jobTitle,department,officeLocation,accountEnabled,assignedLicenses')
      .top(100)
      .get();
    
    const users = response.value || [];
    
    logger.info(`Retrieved ${users.length} users from tenant via user auth`);
    
    const apiResponse: ApiResponse = {
      success: true,
      data: users,
      message: `Retrieved ${users.length} users from your tenant`
    };
    
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Error fetching user data with user token:', error);
    res.status(500).json({
      success: false,
      error: 'GRAPH_API_ERROR',
      message: `Failed to fetch user data: ${error.message}`,
      details: error.code || error.message
    });
  }
}));

/**
 * POST /secure-data/groups
 * Get real group data using user's access token
 */
router.post('/groups', asyncHandler(async (req: any, res: Response) => {
  try {
    const { accessToken } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_TOKEN',
        message: 'Access token is required'
      });
    }

    const graphClient = createGraphClient(accessToken);
    
    const response = await graphClient
      .api('/groups')
      .select('id,displayName,description,groupTypes,mail,mailEnabled,securityEnabled,createdDateTime')
      .top(100)
      .get();
    
    const groups = response.value || [];
    
    logger.info(`Retrieved ${groups.length} groups from tenant via user auth`);
    
    const apiResponse: ApiResponse = {
      success: true,
      data: groups,
      message: `Retrieved ${groups.length} groups from your tenant`
    };
    
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Error fetching group data with user token:', error);
    res.status(500).json({
      success: false,
      error: 'GRAPH_API_ERROR',
      message: `Failed to fetch group data: ${error.message}`,
      details: error.code || error.message
    });
  }
}));

/**
 * POST /secure-data/audit-logs
 * Get real audit log data using user's access token
 */
router.post('/audit-logs', asyncHandler(async (req: any, res: Response) => {
  try {
    const { accessToken, days = 7 } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_TOKEN',
        message: 'Access token is required'
      });
    }

    const graphClient = createGraphClient(accessToken);
    
    // Get directory audit logs for specified days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const response = await graphClient
      .api('/auditLogs/directoryAudits')
      .filter(`activityDateTime ge ${startDate.toISOString()}`)
      .top(100)
      .get();
    
    const auditLogs = response.value || [];
    
    logger.info(`Retrieved ${auditLogs.length} audit logs from tenant via user auth`);
    
    const apiResponse: ApiResponse = {
      success: true,
      data: auditLogs,
      message: `Retrieved ${auditLogs.length} audit logs from your tenant`
    };
    
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Error fetching audit log data with user token:', error);
    res.status(500).json({
      success: false,
      error: 'GRAPH_API_ERROR',
      message: `Failed to fetch audit log data: ${error.message}`,
      details: error.code || error.message
    });
  }
}));

/**
 * POST /secure-data/organization
 * Get organization info using user's access token
 */
router.post('/organization', asyncHandler(async (req: any, res: Response) => {
  try {
    const { accessToken } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_TOKEN',
        message: 'Access token is required'
      });
    }

    const graphClient = createGraphClient(accessToken);
    
    const response = await graphClient.api('/organization').get();
    const organization = response.value?.[0] || {};
    
    logger.info('Retrieved organization info from tenant via user auth');
    
    const apiResponse: ApiResponse = {
      success: true,
      data: organization,
      message: 'Retrieved organization info from your tenant'
    };
    
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Error fetching organization data with user token:', error);
    res.status(500).json({
      success: false,
      error: 'GRAPH_API_ERROR',
      message: `Failed to fetch organization data: ${error.message}`,
      details: error.code || error.message
    });
  }
}));

/**
 * POST /secure-data/me
 * Get current user info using user's access token
 */
router.post('/me', asyncHandler(async (req: any, res: Response) => {
  try {
    const { accessToken } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_TOKEN',
        message: 'Access token is required'
      });
    }

    const graphClient = createGraphClient(accessToken);
    
    const me = await graphClient.api('/me').get();
    
    logger.info(`Retrieved user info for ${me.displayName} via user auth`);
    
    const apiResponse: ApiResponse = {
      success: true,
      data: me,
      message: 'Retrieved your user information'
    };
    
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Error fetching current user data with user token:', error);
    res.status(500).json({
      success: false,
      error: 'GRAPH_API_ERROR',
      message: `Failed to fetch user data: ${error.message}`,
      details: error.code || error.message
    });
  }
}));

export default router;