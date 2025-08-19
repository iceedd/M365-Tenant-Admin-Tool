import { Router, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse } from '../types/index';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';
import { config } from '../config/index';
import logger from '../utils/logger';

const router = Router();

/**
 * Temporary route to test real Graph API data without full auth flow
 * This bypasses normal authentication for testing purposes only
 */

// Create MSAL instance for client credentials flow
const msalInstance = new ConfidentialClientApplication({
  auth: {
    clientId: config.azureAd.clientId,
    clientSecret: config.azureAd.clientSecret, // You'll need to provide this
    authority: `https://login.microsoftonline.com/${config.azureAd.tenantId}`
  }
});

/**
 * Get access token using client credentials (app-only permissions)
 */
async function getAppOnlyToken(): Promise<string> {
  try {
    const clientCredentialRequest = {
      scopes: ['https://graph.microsoft.com/.default'],
    };

    const response = await msalInstance.acquireTokenByClientCredential(clientCredentialRequest);
    
    if (!response?.accessToken) {
      throw new Error('Failed to acquire access token');
    }
    
    return response.accessToken;
  } catch (error: any) {
    logger.error('Error acquiring app-only token:', error);
    throw new Error(`Token acquisition failed: ${error.message}`);
  }
}

/**
 * Create Graph client with app-only token
 */
async function getGraphClient(): Promise<Client> {
  const accessToken = await getAppOnlyToken();
  
  const client = Client.init({
    authProvider: {
      getAccessToken: async () => accessToken
    }
  });
  
  return client;
}

/**
 * GET /test-data/licenses
 * Get real license data from your tenant
 */
router.get('/licenses', asyncHandler(async (req: any, res: Response) => {
  try {
    const graphClient = await getGraphClient();
    
    // Get subscribed SKUs (licenses) from your tenant
    const response = await graphClient.api('/subscribedSkus').get();
    const licenses = response.value || [];
    
    logger.info(`Retrieved ${licenses.length} licenses from tenant`);
    
    const apiResponse: ApiResponse = {
      success: true,
      data: licenses,
      message: `Retrieved ${licenses.length} licenses from your tenant`
    };
    
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Error fetching real license data:', error);
    res.status(500).json({
      success: false,
      error: 'GRAPH_API_ERROR',
      message: `Failed to fetch license data: ${error.message}`,
      details: error
    });
  }
}));

/**
 * GET /test-data/users
 * Get real user data from your tenant
 */
router.get('/users', asyncHandler(async (req: any, res: Response) => {
  try {
    const graphClient = await getGraphClient();
    
    // Get users from your tenant
    const response = await graphClient
      .api('/users')
      .select('id,displayName,userPrincipalName,mail,jobTitle,department,officeLocation,accountEnabled,assignedLicenses')
      .top(50)
      .get();
    
    const users = response.value || [];
    
    logger.info(`Retrieved ${users.length} users from tenant`);
    
    const apiResponse: ApiResponse = {
      success: true,
      data: users,
      message: `Retrieved ${users.length} users from your tenant`
    };
    
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Error fetching real user data:', error);
    res.status(500).json({
      success: false,
      error: 'GRAPH_API_ERROR',
      message: `Failed to fetch user data: ${error.message}`,
      details: error
    });
  }
}));

/**
 * GET /test-data/groups
 * Get real group data from your tenant
 */
router.get('/groups', asyncHandler(async (req: any, res: Response) => {
  try {
    const graphClient = await getGraphClient();
    
    const response = await graphClient
      .api('/groups')
      .select('id,displayName,description,groupTypes,mail,mailEnabled,securityEnabled,createdDateTime')
      .top(50)
      .get();
    
    const groups = response.value || [];
    
    logger.info(`Retrieved ${groups.length} groups from tenant`);
    
    const apiResponse: ApiResponse = {
      success: true,
      data: groups,
      message: `Retrieved ${groups.length} groups from your tenant`
    };
    
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Error fetching real group data:', error);
    res.status(500).json({
      success: false,
      error: 'GRAPH_API_ERROR',
      message: `Failed to fetch group data: ${error.message}`,
      details: error
    });
  }
}));

/**
 * GET /test-data/audit-logs
 * Get real audit log data from your tenant
 */
router.get('/audit-logs', asyncHandler(async (req: any, res: Response) => {
  try {
    const graphClient = await getGraphClient();
    
    // Get directory audit logs (last 7 days)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    const response = await graphClient
      .api('/auditLogs/directoryAudits')
      .filter(`activityDateTime ge ${startDate.toISOString()}`)
      .top(50)
      .get();
    
    const auditLogs = response.value || [];
    
    logger.info(`Retrieved ${auditLogs.length} audit logs from tenant`);
    
    const apiResponse: ApiResponse = {
      success: true,
      data: auditLogs,
      message: `Retrieved ${auditLogs.length} audit logs from your tenant`
    };
    
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Error fetching real audit log data:', error);
    res.status(500).json({
      success: false,
      error: 'GRAPH_API_ERROR', 
      message: `Failed to fetch audit log data: ${error.message}`,
      details: error
    });
  }
}));

/**
 * GET /test-data/organization
 * Get organization info from your tenant
 */
router.get('/organization', asyncHandler(async (req: any, res: Response) => {
  try {
    const graphClient = await getGraphClient();
    
    const response = await graphClient.api('/organization').get();
    const organization = response.value?.[0] || {};
    
    logger.info('Retrieved organization info from tenant');
    
    const apiResponse: ApiResponse = {
      success: true,
      data: organization,
      message: 'Retrieved organization info from your tenant'
    };
    
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Error fetching organization data:', error);
    res.status(500).json({
      success: false,
      error: 'GRAPH_API_ERROR',
      message: `Failed to fetch organization data: ${error.message}`,
      details: error
    });
  }
}));

export default router;