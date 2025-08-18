import { Router, Response } from 'express';
import GraphService from '@/services/graphService';
import { authenticate, graphAuth } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { AuthenticatedRequest, License, ApiResponse } from '@/types';
import { logUserAction } from '@/utils/logger';

const router = Router();

// Apply authentication to all license routes
router.use(authenticate);
router.use(graphAuth);

/**
 * GET /licenses
 * Get all available licenses in the organization
 */
router.get(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const graphService = new GraphService('access_token_here', req.user.id);
    const licenses = await graphService.getLicenses();
    
    logUserAction('list_licenses', req.user.id, 'licenses', {
      count: licenses.length
    });
    
    const response: ApiResponse<License[]> = {
      success: true,
      data: licenses,
      message: `Retrieved ${licenses.length} available licenses`
    };
    
    res.json(response);
  })
);

/**
 * GET /licenses/summary
 * Get license usage summary
 */
router.get(
  '/summary',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const graphService = new GraphService('access_token_here', req.user.id);
    const licenses = await graphService.getLicenses();
    
    // Calculate summary statistics
    const summary = licenses.map(license => ({
      skuId: license.skuId,
      skuPartNumber: license.skuPartNumber,
      totalUnits: license.prepaidUnits.enabled,
      consumedUnits: license.consumedUnits,
      availableUnits: license.prepaidUnits.enabled - license.consumedUnits,
      utilizationPercent: Math.round((license.consumedUnits / license.prepaidUnits.enabled) * 100),
      suspendedUnits: license.prepaidUnits.suspended,
      warningUnits: license.prepaidUnits.warning
    }));
    
    const totalLicenses = summary.reduce((sum, s) => sum + s.totalUnits, 0);
    const totalConsumed = summary.reduce((sum, s) => sum + s.consumedUnits, 0);
    const totalAvailable = summary.reduce((sum, s) => sum + s.availableUnits, 0);
    
    logUserAction('get_license_summary', req.user.id, 'licenses');
    
    const response: ApiResponse = {
      success: true,
      data: {
        licenses: summary,
        totals: {
          totalLicenses,
          totalConsumed,
          totalAvailable,
          overallUtilization: Math.round((totalConsumed / totalLicenses) * 100)
        }
      },
      message: 'License summary retrieved successfully'
    };
    
    res.json(response);
  })
);

/**
 * GET /licenses/:skuId
 * Get detailed information about a specific license
 */
router.get(
  '/:skuId',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { skuId } = req.params;
    
    const graphService = new GraphService('access_token_here', req.user.id);
    const licenses = await graphService.getLicenses();
    
    const license = licenses.find(l => l.skuId === skuId);
    
    if (!license) {
      return res.status(404).json({
        success: false,
        error: 'LICENSE_NOT_FOUND',
        message: `License with SKU ID ${skuId} not found`
      });
    }
    
    // Add detailed usage information
    const detailedLicense = {
      ...license,
      usage: {
        totalUnits: license.prepaidUnits.enabled,
        consumedUnits: license.consumedUnits,
        availableUnits: license.prepaidUnits.enabled - license.consumedUnits,
        utilizationPercent: Math.round((license.consumedUnits / license.prepaidUnits.enabled) * 100),
        suspendedUnits: license.prepaidUnits.suspended,
        warningUnits: license.prepaidUnits.warning
      },
      servicePlans: license.servicePlans.map(plan => ({
        servicePlanId: plan.servicePlanId,
        servicePlanName: plan.servicePlanName,
        provisioningStatus: plan.provisioningStatus,
        appliesTo: plan.appliesTo
      }))
    };
    
    logUserAction('get_license_details', req.user.id, `license:${skuId}`);
    
    const response: ApiResponse = {
      success: true,
      data: detailedLicense,
      message: 'License details retrieved successfully'
    };
    
    res.json(response);
  })
);

/**
 * GET /licenses/:skuId/users
 * Get users assigned to a specific license (Note: This requires additional Graph API calls)
 */
router.get(
  '/:skuId/users',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { skuId } = req.params;
    const { top = 50 } = req.query;
    
    // Note: This would require implementing a method to get users with specific license
    // For now, returning a placeholder response
    
    logUserAction('get_license_users', req.user.id, `license:${skuId}`);
    
    const response: ApiResponse = {
      success: true,
      data: [],
      message: `Users with license ${skuId} retrieved successfully`
    };
    
    res.json(response);
  })
);

/**
 * GET /licenses/serviceplans
 * Get all available service plans
 */
router.get(
  '/serviceplans',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const graphService = new GraphService('access_token_here', req.user.id);
    const licenses = await graphService.getLicenses();
    
    // Extract all unique service plans
    const servicePlansMap = new Map();
    
    licenses.forEach(license => {
      license.servicePlans.forEach(plan => {
        if (!servicePlansMap.has(plan.servicePlanId)) {
          servicePlansMap.set(plan.servicePlanId, {
            servicePlanId: plan.servicePlanId,
            servicePlanName: plan.servicePlanName,
            appliesTo: plan.appliesTo,
            associatedLicenses: []
          });
        }
        
        servicePlansMap.get(plan.servicePlanId).associatedLicenses.push({
          skuId: license.skuId,
          skuPartNumber: license.skuPartNumber,
          provisioningStatus: plan.provisioningStatus
        });
      });
    });
    
    const servicePlans = Array.from(servicePlansMap.values());
    
    logUserAction('list_service_plans', req.user.id, 'service_plans', {
      count: servicePlans.length
    });
    
    const response: ApiResponse = {
      success: true,
      data: servicePlans,
      message: `Retrieved ${servicePlans.length} service plans`
    };
    
    res.json(response);
  })
);

/**
 * GET /licenses/reports/usage
 * Get license usage reports (aggregated data)
 */
router.get(
  '/reports/usage',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { period = '30' } = req.query; // Default to 30 days
    
    const graphService = new GraphService('access_token_here', req.user.id);
    const licenses = await graphService.getLicenses();
    
    // Generate usage report
    const usageReport = {
      reportPeriodDays: parseInt(period as string),
      generatedAt: new Date().toISOString(),
      licenses: licenses.map(license => {
        const utilizationPercent = Math.round((license.consumedUnits / license.prepaidUnits.enabled) * 100);
        
        return {
          skuId: license.skuId,
          skuPartNumber: license.skuPartNumber,
          totalUnits: license.prepaidUnits.enabled,
          consumedUnits: license.consumedUnits,
          availableUnits: license.prepaidUnits.enabled - license.consumedUnits,
          utilizationPercent,
          status: utilizationPercent > 90 ? 'critical' : 
                 utilizationPercent > 75 ? 'warning' : 'normal',
          servicePlansCount: license.servicePlans.length
        };
      }),
      summary: {
        totalLicenseTypes: licenses.length,
        totalUnitsAcrossAllLicenses: licenses.reduce((sum, l) => sum + l.prepaidUnits.enabled, 0),
        totalConsumedAcrossAllLicenses: licenses.reduce((sum, l) => sum + l.consumedUnits, 0),
        overallUtilization: Math.round(
          (licenses.reduce((sum, l) => sum + l.consumedUnits, 0) / 
           licenses.reduce((sum, l) => sum + l.prepaidUnits.enabled, 0)) * 100
        )
      }
    };
    
    logUserAction('get_license_usage_report', req.user.id, 'license_reports', {
      period: period
    });
    
    const response: ApiResponse = {
      success: true,
      data: usageReport,
      message: 'License usage report generated successfully'
    };
    
    res.json(response);
  })
);

export default router;