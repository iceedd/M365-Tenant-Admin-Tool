import { Router } from 'express';
import { getGraphClient } from '../services/graphService';
import { authenticateToken } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();

// Apply authentication middleware to all settings routes
router.use(authenticateToken);

// Default user preferences (stored in-memory for demo)
const defaultUserPreferences = [
  {
    id: 'theme',
    category: 'Appearance',
    name: 'Theme',
    description: 'Choose your preferred color theme',
    value: 'light',
    type: 'select',
    options: ['light', 'dark', 'auto']
  },
  {
    id: 'language',
    category: 'Localization',
    name: 'Language',
    description: 'Interface language preference',
    value: 'en-US',
    type: 'select',
    options: ['en-US', 'en-GB', 'fr-FR', 'de-DE', 'es-ES']
  },
  {
    id: 'timezone',
    category: 'Localization',
    name: 'Timezone',
    description: 'Your local timezone for date/time display',
    value: 'UTC',
    type: 'select',
    options: ['UTC', 'America/New_York', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo']
  },
  {
    id: 'notifications',
    category: 'Notifications',
    name: 'Email Notifications',
    description: 'Receive email notifications for important events',
    value: true,
    type: 'boolean'
  },
  {
    id: 'realTimeUpdates',
    category: 'Performance',
    name: 'Real-time Updates',
    description: 'Enable live data updates and notifications',
    value: true,
    type: 'boolean'
  },
  {
    id: 'autoRefresh',
    category: 'Performance',
    name: 'Auto Refresh Interval',
    description: 'Automatic data refresh interval in minutes',
    value: 5,
    type: 'slider',
    min: 1,
    max: 60
  },
  {
    id: 'pageSize',
    category: 'Display',
    name: 'Items per Page',
    description: 'Number of items to display in tables and lists',
    value: 25,
    type: 'select',
    options: ['10', '25', '50', '100']
  }
];

// Default tenant settings (would normally be stored in a database)
const defaultTenantSettings = [
  {
    id: 'defaultLicense',
    category: 'User Management',
    name: 'Default License Type',
    description: 'Default license assigned to new users',
    value: 'Microsoft 365 E3',
    type: 'select',
    options: ['Microsoft 365 E3', 'Microsoft 365 E5', 'Microsoft 365 Business Premium'],
    securityLevel: 'medium'
  },
  {
    id: 'passwordPolicy',
    category: 'Security',
    name: 'Enforce Strong Passwords',
    description: 'Require complex passwords for all users',
    value: true,
    type: 'boolean',
    securityLevel: 'high'
  },
  {
    id: 'mfaRequired',
    category: 'Security',
    name: 'Require Multi-Factor Authentication',
    description: 'Force MFA for all user accounts',
    value: true,
    type: 'boolean',
    securityLevel: 'high'
  },
  {
    id: 'sessionTimeout',
    category: 'Security',
    name: 'Session Timeout (hours)',
    description: 'Automatically log out inactive users',
    value: 8,
    type: 'number',
    securityLevel: 'medium'
  },
  {
    id: 'auditRetention',
    category: 'Compliance',
    name: 'Audit Log Retention (days)',
    description: 'How long to keep audit logs',
    value: 90,
    type: 'number',
    securityLevel: 'high'
  },
  {
    id: 'guestAccess',
    category: 'Access Control',
    name: 'Allow Guest Users',
    description: 'Enable external user collaboration',
    value: false,
    type: 'boolean',
    securityLevel: 'high'
  },
  {
    id: 'autoProvision',
    category: 'Automation',
    name: 'Auto-Provision New Users',
    description: 'Automatically create user accounts from HR system',
    value: false,
    type: 'boolean',
    requiresRestart: true,
    securityLevel: 'medium'
  }
];

// Maintain in-memory storage of user preferences and settings (would use a database in production)
let userPreferencesStore = {...defaultUserPreferences};
let tenantSettingsStore = {...defaultTenantSettings};

/**
 * GET /api/settings/user-preferences
 * Get user preferences
 */
router.get('/user-preferences', (req, res) => {
  try {
    // In a real app, this would fetch from a database based on the user ID
    // For this demo, we'll return the in-memory data
    res.json(defaultUserPreferences);
  } catch (error: any) {
    logger.error('Error fetching user preferences:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve user preferences',
      details: error.message 
    });
  }
});

/**
 * PUT /api/settings/user-preferences
 * Update user preferences
 */
router.put('/user-preferences', (req, res) => {
  try {
    const updatedPreferences = req.body;
    
    // Validate the input
    if (!Array.isArray(updatedPreferences)) {
      return res.status(400).json({ error: 'Invalid preferences format' });
    }
    
    // In a real app, this would update a database
    userPreferencesStore = updatedPreferences;
    
    res.json({ 
      success: true, 
      message: 'User preferences updated successfully' 
    });
  } catch (error: any) {
    logger.error('Error updating user preferences:', error);
    res.status(500).json({ 
      error: 'Failed to update user preferences',
      details: error.message 
    });
  }
});

/**
 * GET /api/settings/tenant
 * Get tenant settings
 */
router.get('/tenant', (req, res) => {
  try {
    // In a real app, this would fetch from a database or Microsoft Graph API
    res.json(defaultTenantSettings);
  } catch (error: any) {
    logger.error('Error fetching tenant settings:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve tenant settings',
      details: error.message 
    });
  }
});

/**
 * PUT /api/settings/tenant
 * Update tenant settings
 */
router.put('/tenant', (req, res) => {
  try {
    const updatedSettings = req.body;
    
    // Validate the input
    if (!Array.isArray(updatedSettings)) {
      return res.status(400).json({ error: 'Invalid settings format' });
    }
    
    // In a real app, this would update a database or Microsoft Graph API
    tenantSettingsStore = updatedSettings;
    
    res.json({ 
      success: true, 
      message: 'Tenant settings updated successfully' 
    });
  } catch (error: any) {
    logger.error('Error updating tenant settings:', error);
    res.status(500).json({ 
      error: 'Failed to update tenant settings',
      details: error.message 
    });
  }
});

/**
 * GET /api/settings/security-overview
 * Get security overview data
 */
router.get('/security-overview', async (req, res) => {
  try {
    const client = getGraphClient(req);
    
    // Get organization data
    const orgResponse = await client.api('/organization').get();
    const organization = orgResponse.value[0] || {};
    
    // Get users count for MFA stats
    const usersResponse = await client.api('/users').count(true).get();
    const totalUsers = usersResponse['@odata.count'] || 0;
    
    // Get security defaults status - would require Security API in real implementation
    // For demo purposes, we'll use mock data based on organization settings
    
    // In a real app, we would call Microsoft Graph Security API endpoints
    // for Secure Score, MFA status, etc.
    
    const securityOverview = {
      multiFactorAuth: {
        enabledCount: Math.floor(totalUsers * 0.94), // Mock 94% compliance
        totalCount: totalUsers,
        complianceRate: 94.2
      },
      passwordPolicy: {
        compliantCount: Math.floor(totalUsers * 0.87), // Mock 87% compliance
        totalCount: totalUsers,
        complianceRate: 87.5
      },
      guestUsers: {
        needsReviewCount: Math.floor(totalUsers * 0.05), // Mock 5% of total as guests
        totalCount: Math.floor(totalUsers * 0.22), // Mock 22% of guests need review
        reviewRate: 22.3
      },
      systemInfo: {
        appVersion: 'v2.1.0',
        isUpToDate: true,
        databaseVersion: 'SQL Server 2019',
        lastBackup: new Date().toISOString(), // Current date
        nextMaintenance: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days from now
      }
    };
    
    res.json(securityOverview);
  } catch (error: any) {
    logger.error('Error fetching security overview:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve security overview',
      details: error.message 
    });
  }
});

/**
 * GET /api/settings/admin-users
 * Get admin users
 */
router.get('/admin-users', async (req, res) => {
  try {
    const client = getGraphClient(req);
    
    // Get directory role definitions
    const roleDefinitionsResponse = await client.api('/directoryRoles')
      .expand('members')
      .get();
    
    // Process each role and its members
    const adminRoles = new Map();
    
    for (const role of roleDefinitionsResponse.value) {
      const roleName = role.displayName;
      
      // Skip non-admin roles
      if (!roleName.includes('Administrator') && !roleName.includes('Admin')) {
        continue;
      }
      
      if (role.members) {
        for (const member of role.members) {
          if (!adminRoles.has(member.id)) {
            adminRoles.set(member.id, {
              id: member.id,
              roles: [roleName]
            });
          } else {
            adminRoles.get(member.id).roles.push(roleName);
          }
        }
      }
    }
    
    // If we found admin users, get their details
    const adminUsers = [];
    
    if (adminRoles.size > 0) {
      const adminIds = Array.from(adminRoles.keys());
      
      for (const adminId of adminIds) {
        try {
          const userResponse = await client.api(`/users/${adminId}`)
            .select('id,displayName,userPrincipalName,userType,signInActivity')
            .get();
          
          // Get last sign-in time if available
          const lastActive = userResponse.signInActivity?.lastSignInDateTime || 
                            userResponse.signInActivity?.lastNonInteractiveSignInDateTime || 
                            new Date().toISOString();
          
          // Build permissions based on roles
          const roles = adminRoles.get(adminId).roles;
          const permissions = [];
          
          if (roles.includes('Global Administrator')) {
            permissions.push('read', 'write', 'delete', 'admin');
          } else if (roles.includes('User Administrator') || roles.includes('Group Administrator')) {
            permissions.push('read', 'write');
          } else {
            permissions.push('read');
          }
          
          adminUsers.push({
            id: userResponse.id,
            displayName: userResponse.displayName,
            userPrincipalName: userResponse.userPrincipalName,
            roles: roles,
            lastActive: lastActive,
            status: 'active', // Would check user status in a real app
            permissions: permissions
          });
        } catch (userError) {
          logger.warn(`Couldn't fetch details for admin user ${adminId}:`, userError);
        }
      }
    }
    
    // If we couldn't find any admin users through the Graph API, use mock data
    if (adminUsers.length === 0) {
      adminUsers.push({
        id: '1',
        displayName: 'Current User',
        userPrincipalName: req.user?.username || 'admin@tenant.onmicrosoft.com',
        roles: ['Global Administrator'],
        lastActive: new Date().toISOString(),
        status: 'active',
        permissions: ['read', 'write', 'delete', 'admin']
      });
    }
    
    res.json(adminUsers);
  } catch (error: any) {
    logger.error('Error fetching admin users:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve admin users',
      details: error.message 
    });
  }
});

/**
 * POST /api/settings/admin-users
 * Add admin user
 */
router.post('/admin-users', async (req, res) => {
  try {
    const { displayName, userPrincipalName, roles } = req.body;
    
    // Validate required fields
    if (!displayName || !userPrincipalName || !roles || !Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const client = getGraphClient(req);
    
    // Check if user exists
    let userId;
    try {
      const userResponse = await client.api('/users')
        .filter(`userPrincipalName eq '${userPrincipalName}'`)
        .select('id')
        .get();
      
      if (userResponse.value && userResponse.value.length > 0) {
        userId = userResponse.value[0].id;
      }
    } catch (userError) {
      logger.warn(`Error checking for existing user:`, userError);
    }
    
    // For demo purposes, we'll just return a mock successful response
    // In a real app, we would add the user to the appropriate directory roles
    
    const newAdminUser = {
      id: userId || String(Date.now()),
      displayName,
      userPrincipalName,
      roles,
      lastActive: new Date().toISOString(),
      status: 'active',
      permissions: roles.includes('Global Administrator') ? 
        ['read', 'write', 'delete', 'admin'] : ['read', 'write']
    };
    
    res.status(201).json({
      success: true,
      message: 'Administrator added successfully',
      user: newAdminUser
    });
  } catch (error: any) {
    logger.error('Error adding admin user:', error);
    res.status(500).json({ 
      error: 'Failed to add administrator',
      details: error.message 
    });
  }
});

/**
 * DELETE /api/settings/admin-users/:id
 * Remove admin user
 */
router.delete('/admin-users/:id', async (req, res) => {
  try {
    const adminId = req.params.id;
    
    // In a real app, we would remove the user from directory roles
    // For demo purposes, we'll just return a success response
    
    res.json({
      success: true,
      message: 'Administrator removed successfully'
    });
  } catch (error: any) {
    logger.error('Error removing admin user:', error);
    res.status(500).json({ 
      error: 'Failed to remove administrator',
      details: error.message 
    });
  }
});

export default router;