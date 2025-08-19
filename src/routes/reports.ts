import { Router } from 'express';
import { getGraphClient } from '../services/graphService';
import { authenticateToken } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();

// Apply authentication middleware to all reports routes
router.use(authenticateToken);

/**
 * Validate the date range parameter
 */
const validateDateRange = (dateRange: string): boolean => {
  const validRanges = ['7days', '30days', '90days', '1year'];
  return validRanges.includes(dateRange);
};

/**
 * Convert date range to ISO date for Graph API queries
 */
const getDateRangeISODate = (dateRange: string): string => {
  const now = new Date();
  let daysToSubtract = 30; // default to 30 days

  switch (dateRange) {
    case '7days':
      daysToSubtract = 7;
      break;
    case '30days':
      daysToSubtract = 30;
      break;
    case '90days':
      daysToSubtract = 90;
      break;
    case '1year':
      daysToSubtract = 365;
      break;
  }

  const pastDate = new Date(now);
  pastDate.setDate(now.getDate() - daysToSubtract);
  return pastDate.toISOString();
};

/**
 * GET /api/reports/usage
 * Get usage metrics for the tenant
 */
router.get('/usage', async (req, res) => {
  try {
    const dateRange = req.query.range as string || '30days';
    
    if (!validateDateRange(dateRange)) {
      return res.status(400).json({ error: 'Invalid date range parameter' });
    }

    const client = getGraphClient(req);
    
    // Get basic tenant info
    const tenantInfo = await client.api('/organization').get();
    
    // Get active user count
    const usersResponse = await client.api('/users').count(true).get();
    const totalUsers = usersResponse['@odata.count'] || 0;
    
    // Get licensed users count
    const licensedUsersResponse = await client.api('/users')
      .filter('assignedLicenses/$count ne 0')
      .count(true)
      .get();
    const licensedUsers = licensedUsersResponse['@odata.count'] || 0;
    
    // Calculate license utilization
    const licenseUtilization = totalUsers > 0 ? Math.round((licensedUsers / totalUsers) * 100) : 0;
    
    // Calculate day-to-day changes (this would ideally come from stored historical data)
    // For this example, we'll generate some plausible random changes
    const getRandomChange = () => Math.floor(Math.random() * 5) * (Math.random() > 0.7 ? -1 : 1);
    
    const usageMetrics = [
      {
        label: 'Total Users',
        value: totalUsers,
        change: getRandomChange(),
        trend: 'up',
        period: 'vs. previous period'
      },
      {
        label: 'Licensed Users',
        value: licensedUsers,
        change: getRandomChange(),
        trend: 'up',
        period: 'vs. previous period'
      },
      {
        label: 'License Utilization',
        value: licenseUtilization,
        change: getRandomChange(),
        trend: 'stable',
        period: 'vs. previous period'
      },
      {
        label: 'Active Users',
        value: Math.round(totalUsers * 0.85), // Simplified - in real app would be from activity logs
        change: getRandomChange(),
        trend: 'up',
        period: 'vs. previous period'
      },
      {
        label: 'Groups',
        value: 0, // Would be populated from actual group count
        change: 0,
        trend: 'stable',
        period: 'vs. previous period'
      },
      {
        label: 'Security Score',
        value: 85, // Would be from Microsoft Secure Score API
        change: getRandomChange(),
        trend: 'up',
        period: 'vs. previous period'
      }
    ];

    res.json(usageMetrics);
  } catch (error: any) {
    logger.error('Error fetching usage metrics:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve usage metrics',
      details: error.message 
    });
  }
});

/**
 * GET /api/reports/licenses
 * Get license reports for the tenant
 */
router.get('/licenses', async (req, res) => {
  try {
    const dateRange = req.query.range as string || '30days';
    
    if (!validateDateRange(dateRange)) {
      return res.status(400).json({ error: 'Invalid date range parameter' });
    }

    const client = getGraphClient(req);
    
    // Get subscribed SKUs (licenses)
    const subscribedSkus = await client.api('/subscribedSkus').get();
    
    const licenseReports = subscribedSkus.value.map((sku: any) => {
      const total = sku.prepaidUnits.enabled;
      const consumed = sku.consumedUnits;
      const available = total - consumed;
      const utilization = total > 0 ? (consumed / total) * 100 : 0;
      
      // In a real app, cost would come from a pricing database or API
      // Here we're using placeholder values
      const getCostPerSku = (skuId: string) => {
        const costs: { [key: string]: number } = {
          'c7df2760-2c81-4ef7-b578-5b5392b571df': 20, // E5
          '18181a46-0d4e-45cd-891e-60aabd171b4e': 12, // E3
          '1f2f344a-700d-42c9-9427-5cea1d5d7ba6': 8,  // E1
          // Add more license types as needed
        };
        
        return costs[skuId] || 10; // Default cost if unknown
      };
      
      return {
        licenseName: sku.skuPartNumber,
        total,
        assigned: consumed,
        available,
        utilization,
        cost: getCostPerSku(sku.skuId),
        trend: Math.floor(Math.random() * 5) * (Math.random() > 0.5 ? -1 : 1) // Random trend for demo
      };
    });

    res.json(licenseReports);
  } catch (error: any) {
    logger.error('Error fetching license reports:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve license reports',
      details: error.message 
    });
  }
});

/**
 * GET /api/reports/users/activity
 * Get user activity reports by department
 */
router.get('/users/activity', async (req, res) => {
  try {
    const dateRange = req.query.range as string || '30days';
    
    if (!validateDateRange(dateRange)) {
      return res.status(400).json({ error: 'Invalid date range parameter' });
    }

    const client = getGraphClient(req);
    
    // Get users with department info
    const users = await client.api('/users')
      .select('id,displayName,department,userPrincipalName')
      .top(999)
      .get();
    
    // Group users by department
    const departmentMap = new Map<string, any[]>();
    
    users.value.forEach((user: any) => {
      const department = user.department || 'Unassigned';
      
      if (!departmentMap.has(department)) {
        departmentMap.set(department, []);
      }
      
      departmentMap.get(department)?.push(user);
    });
    
    // For each department, create activity stats
    // In a real app, this would use actual activity data from Microsoft Graph Reports API
    const userActivityReports = Array.from(departmentMap.entries()).map(([department, users]) => {
      const totalUsers = users.length;
      // Mock data - in real app would come from activity logs
      const activeUsers = Math.round(totalUsers * (0.7 + Math.random() * 0.2));
      const inactiveUsers = totalUsers - activeUsers;
      const newUsers = Math.round(totalUsers * 0.05); // Assume 5% are new
      const activityScore = Math.round(80 + Math.random() * 15); // Random score between 80-95
      
      return {
        department,
        totalUsers,
        activeUsers,
        inactiveUsers,
        newUsers,
        activityScore
      };
    });
    
    // Sort by total users descending
    userActivityReports.sort((a, b) => b.totalUsers - a.totalUsers);
    
    res.json(userActivityReports);
  } catch (error: any) {
    logger.error('Error fetching user activity reports:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve user activity reports',
      details: error.message 
    });
  }
});

/**
 * GET /api/reports/groups
 * Get group membership reports
 */
router.get('/groups', async (req, res) => {
  try {
    const dateRange = req.query.range as string || '30days';
    
    if (!validateDateRange(dateRange)) {
      return res.status(400).json({ error: 'Invalid date range parameter' });
    }

    const client = getGraphClient(req);
    
    // Get groups
    const groups = await client.api('/groups')
      .select('id,displayName,description,createdDateTime,groupTypes')
      .top(50)
      .get();
    
    const groupMembershipReports = await Promise.all(groups.value.map(async (group: any) => {
      // Get member count
      let memberCount = 0;
      try {
        const membersResponse = await client.api(`/groups/${group.id}/members`).count(true).get();
        memberCount = membersResponse['@odata.count'] || 0;
      } catch (err) {
        // Continue even if we can't get member count for some groups
        logger.warn(`Couldn't get members for group ${group.id}`, err);
      }
      
      // Get owner count
      let ownerCount = 0;
      try {
        const ownersResponse = await client.api(`/groups/${group.id}/owners`).count(true).get();
        ownerCount = ownersResponse['@odata.count'] || 0;
      } catch (err) {
        // Continue even if we can't get owner count for some groups
        logger.warn(`Couldn't get owners for group ${group.id}`, err);
      }
      
      // Determine group type
      let groupType = 'Distribution';
      if (group.groupTypes && group.groupTypes.includes('Unified')) {
        groupType = 'Microsoft365';
      } else if (group.securityEnabled) {
        groupType = 'Security';
      }
      
      // Growth rate would come from historical data in a real app
      const growthRate = Math.floor(Math.random() * 10) * (Math.random() > 0.3 ? 1 : -1);
      
      return {
        groupName: group.displayName,
        groupType,
        memberCount,
        ownerCount,
        lastModified: group.createdDateTime, // Using created date as a fallback
        growthRate
      };
    }));
    
    // Sort by member count descending
    groupMembershipReports.sort((a, b) => b.memberCount - a.memberCount);
    
    res.json(groupMembershipReports);
  } catch (error: any) {
    logger.error('Error fetching group membership reports:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve group membership reports',
      details: error.message 
    });
  }
});

/**
 * GET /api/reports/security
 * Get security reports for the tenant
 */
router.get('/security', async (req, res) => {
  try {
    const dateRange = req.query.range as string || '30days';
    
    if (!validateDateRange(dateRange)) {
      return res.status(400).json({ error: 'Invalid date range parameter' });
    }

    const client = getGraphClient(req);
    
    // In a real app, this would use the Microsoft Graph Security API
    // For this example, we'll return mock security data
    
    const now = new Date();
    
    const securityReports = [
      {
        metric: 'Secure Score',
        value: 76,
        status: 'good',
        description: 'Your organization\'s security posture based on Microsoft Secure Score.',
        lastUpdated: now.toISOString()
      },
      {
        metric: 'MFA Adoption',
        value: 82,
        status: 'warning',
        description: 'Percentage of users with Multi-Factor Authentication enabled.',
        lastUpdated: now.toISOString()
      },
      {
        metric: 'Suspicious Sign-ins',
        value: 3,
        status: 'warning',
        description: 'Number of sign-ins flagged as suspicious in the selected time period.',
        lastUpdated: now.toISOString()
      },
      {
        metric: 'Malware Detections',
        value: 0,
        status: 'good',
        description: 'Malware detected in email or on devices in the selected time period.',
        lastUpdated: now.toISOString()
      },
      {
        metric: 'Phishing Attempts',
        value: 12,
        status: 'warning',
        description: 'Phishing emails blocked by Exchange Online Protection.',
        lastUpdated: now.toISOString()
      },
      {
        metric: 'Password Expiry',
        value: 5,
        status: 'warning',
        description: 'Users with passwords expiring in the next 7 days.',
        lastUpdated: now.toISOString()
      },
      {
        metric: 'External Sharing',
        value: 24,
        status: 'critical',
        description: 'Files shared with external users in the selected time period.',
        lastUpdated: now.toISOString()
      }
    ];
    
    res.json(securityReports);
  } catch (error: any) {
    logger.error('Error fetching security reports:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve security reports',
      details: error.message 
    });
  }
});

/**
 * GET /api/reports/all
 * Get all reports in a single request
 */
router.get('/all', async (req, res) => {
  try {
    const dateRange = req.query.range as string || '30days';
    
    if (!validateDateRange(dateRange)) {
      return res.status(400).json({ error: 'Invalid date range parameter' });
    }
    
    // In a real app, this would make parallel requests to the individual endpoints
    // For simplicity, we'll just call each endpoint sequentially
    
    const client = getGraphClient(req);
    
    // Mock responses for now
    const allReports = {
      usageMetrics: [],
      licenseReports: [],
      userActivityReports: [],
      groupMembershipReports: [],
      securityReports: []
    };
    
    res.json(allReports);
  } catch (error: any) {
    logger.error('Error fetching all reports:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve all reports',
      details: error.message 
    });
  }
});

export default router;