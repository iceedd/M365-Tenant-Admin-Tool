import { Router, Response } from 'express';
import GraphService from '@/services/graphService';
import { authenticate, authorize, graphAuth } from '@/middleware/auth';
import { asyncHandler, validate } from '@/middleware/errorHandler';
import { AuthenticatedRequest, User, ApiResponse, PaginatedResponse } from '@/types';
import Joi from 'joi';
import logger, { logUserAction } from '@/utils/logger';

const router = Router();

// Apply authentication to all user routes
router.use(authenticate);
router.use(graphAuth);

// Validation schemas
const createUserSchema = Joi.object({
  displayName: Joi.string().required().min(1).max(256),
  userPrincipalName: Joi.string().email().required(),
  givenName: Joi.string().optional().max(64),
  surname: Joi.string().optional().max(64),
  jobTitle: Joi.string().optional().max(128),
  department: Joi.string().optional().max(64),
  officeLocation: Joi.string().optional().max(128),
  mobilePhone: Joi.string().optional().pattern(/^\+?[1-9]\d{1,14}$/),
  businessPhones: Joi.array().items(Joi.string().pattern(/^\+?[1-9]\d{1,14}$/)).optional(),
  accountEnabled: Joi.boolean().default(true),
  usageLocation: Joi.string().length(2).optional(),
  passwordProfile: Joi.object({
    password: Joi.string().min(8).required(),
    forceChangePasswordNextSignIn: Joi.boolean().default(true)
  }).required()
});

const updateUserSchema = Joi.object({
  displayName: Joi.string().min(1).max(256).optional(),
  givenName: Joi.string().max(64).optional(),
  surname: Joi.string().max(64).optional(),
  jobTitle: Joi.string().max(128).optional(),
  department: Joi.string().max(64).optional(),
  officeLocation: Joi.string().max(128).optional(),
  mobilePhone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
  businessPhones: Joi.array().items(Joi.string().pattern(/^\+?[1-9]\d{1,14}$/)).optional(),
  accountEnabled: Joi.boolean().optional(),
  usageLocation: Joi.string().length(2).optional()
});

const assignLicensesSchema = Joi.object({
  licenseSkuIds: Joi.array().items(Joi.string().guid()).min(1).required()
});

const querySchema = Joi.object({
  filter: Joi.string().optional(),
  select: Joi.string().optional(),
  top: Joi.number().integer().min(1).max(999).optional(),
  page: Joi.number().integer().min(1).default(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(50).optional()
});

/**
 * GET /users
 * Get all users with optional filtering and pagination
 */
router.get(
  '/',
  validate(querySchema, 'query'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { filter, select, top, page, limit } = req.query as any;
    const selectArray = select ? select.split(',') : undefined;
    
    // Create Graph service instance (in production, use stored access token)
    const graphService = new GraphService('access_token_here', req.user.id);
    
    const users = await graphService.getUsers(filter, selectArray, top || limit);
    
    logUserAction('list_users', req.user.id, 'users', {
      filter,
      select: selectArray,
      count: users.length
    });
    
    const response: PaginatedResponse<User> = {
      success: true,
      data: users,
      pagination: {
        page: page || 1,
        limit: limit || 50,
        total: users.length, // In production, implement proper pagination with total count
        hasNext: users.length === (limit || 50),
        hasPrev: (page || 1) > 1
      },
      message: `Retrieved ${users.length} users`
    };
    
    res.json(response);
  })
);

/**
 * GET /users/:id
 * Get a specific user by ID
 */
router.get(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { select } = req.query;
    const selectArray = select ? (select as string).split(',') : undefined;
    
    const graphService = new GraphService('access_token_here', req.user.id);
    const user = await graphService.getUser(id, selectArray);
    
    logUserAction('get_user', req.user.id, `user:${id}`);
    
    const response: ApiResponse<User> = {
      success: true,
      data: user,
      message: 'User retrieved successfully'
    };
    
    res.json(response);
  })
);

/**
 * POST /users
 * Create a new user (requires admin role)
 */
router.post(
  '/',
  authorize(['admin', 'user_admin']),
  validate(createUserSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userData: User = req.body;
    
    const graphService = new GraphService('access_token_here', req.user.id);
    const createdUser = await graphService.createUser(userData);
    
    logUserAction('create_user', req.user.id, `user:${createdUser.id}`, {
      userPrincipalName: createdUser.userPrincipalName,
      displayName: createdUser.displayName
    });
    
    const response: ApiResponse<User> = {
      success: true,
      data: createdUser,
      message: 'User created successfully'
    };
    
    res.status(201).json(response);
  })
);

/**
 * PATCH /users/:id
 * Update an existing user (requires admin role)
 */
router.patch(
  '/:id',
  authorize(['admin', 'user_admin']),
  validate(updateUserSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const updates: Partial<User> = req.body;
    
    const graphService = new GraphService('access_token_here', req.user.id);
    await graphService.updateUser(id, updates);
    
    logUserAction('update_user', req.user.id, `user:${id}`, {
      updates: Object.keys(updates)
    });
    
    const response: ApiResponse = {
      success: true,
      message: 'User updated successfully'
    };
    
    res.json(response);
  })
);

/**
 * DELETE /users/:id
 * Delete a user (requires admin role)
 */
router.delete(
  '/:id',
  authorize(['admin', 'user_admin']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    const graphService = new GraphService('access_token_here', req.user.id);
    await graphService.deleteUser(id);
    
    logUserAction('delete_user', req.user.id, `user:${id}`);
    
    const response: ApiResponse = {
      success: true,
      message: 'User deleted successfully'
    };
    
    res.json(response);
  })
);

/**
 * POST /users/:id/licenses/assign
 * Assign licenses to a user (requires admin role)
 */
router.post(
  '/:id/licenses/assign',
  authorize(['admin', 'license_admin']),
  validate(assignLicensesSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { licenseSkuIds } = req.body;
    
    const graphService = new GraphService('access_token_here', req.user.id);
    await graphService.assignLicenses(id, licenseSkuIds);
    
    logUserAction('assign_licenses', req.user.id, `user:${id}`, {
      licenses: licenseSkuIds
    });
    
    const response: ApiResponse = {
      success: true,
      message: 'Licenses assigned successfully'
    };
    
    res.json(response);
  })
);

/**
 * POST /users/:id/licenses/remove
 * Remove licenses from a user (requires admin role)
 */
router.post(
  '/:id/licenses/remove',
  authorize(['admin', 'license_admin']),
  validate(assignLicensesSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { licenseSkuIds } = req.body;
    
    const graphService = new GraphService('access_token_here', req.user.id);
    await graphService.removeLicenses(id, licenseSkuIds);
    
    logUserAction('remove_licenses', req.user.id, `user:${id}`, {
      licenses: licenseSkuIds
    });
    
    const response: ApiResponse = {
      success: true,
      message: 'Licenses removed successfully'
    };
    
    res.json(response);
  })
);

/**
 * GET /users/:id/licenses
 * Get user's assigned licenses
 */
router.get(
  '/:id/licenses',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    const graphService = new GraphService('access_token_here', req.user.id);
    const licenses = await graphService.getUserLicenses(id);
    
    logUserAction('get_user_licenses', req.user.id, `user:${id}`);
    
    const response: ApiResponse = {
      success: true,
      data: licenses,
      message: 'User licenses retrieved successfully'
    };
    
    res.json(response);
  })
);

/**
 * POST /users/batch
 * Create multiple users in batch (requires admin role)
 */
router.post(
  '/batch',
  authorize(['admin', 'user_admin']),
  validate(Joi.object({
    users: Joi.array().items(createUserSchema).min(1).max(20).required()
  })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { users } = req.body;
    
    const graphService = new GraphService('access_token_here', req.user.id);
    const results = await graphService.createUsersBatch(users);
    
    logUserAction('batch_create_users', req.user.id, 'users', {
      batchSize: users.length,
      successCount: results.filter((r: any) => r.status === 201).length
    });
    
    const response: ApiResponse = {
      success: true,
      data: results,
      message: `Batch user creation completed. ${users.length} users processed.`
    };
    
    res.json(response);
  })
);

export default router;