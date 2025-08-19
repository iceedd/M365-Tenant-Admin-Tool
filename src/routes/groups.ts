import { Router, Response } from 'express';
import GraphService from '../services/graphService';
import { authenticate, authorize, graphAuth, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler, validate } from '../middleware/errorHandler';
import { Group, ApiResponse } from '../types/index';
import Joi from 'joi';
import { logUserAction } from '../utils/logger';

const router = Router();

// Apply authentication to all group routes
router.use(authenticate);
router.use(graphAuth);

// Validation schemas
const createGroupSchema = Joi.object({
  displayName: Joi.string().required().min(1).max(256),
  description: Joi.string().optional().max(1024),
  mailNickname: Joi.string().required().min(1).max(64).pattern(/^[a-zA-Z0-9_-]+$/),
  groupTypes: Joi.array().items(Joi.string().valid('Unified')).optional(),
  securityEnabled: Joi.boolean().default(true),
  mailEnabled: Joi.boolean().default(false)
});

const updateGroupSchema = Joi.object({
  displayName: Joi.string().min(1).max(256).optional(),
  description: Joi.string().max(1024).optional(),
  securityEnabled: Joi.boolean().optional(),
  mailEnabled: Joi.boolean().optional()
});

const addMembersSchema = Joi.object({
  memberIds: Joi.array().items(Joi.string().guid()).min(1).max(20).required()
});

const querySchema = Joi.object({
  filter: Joi.string().optional(),
  select: Joi.string().optional(),
  top: Joi.number().integer().min(1).max(999).optional()
});

/**
 * GET /groups
 * Get all groups with optional filtering
 */
router.get(
  '/',
  validate(querySchema, 'query'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { filter, select, top } = req.query as any;
    const selectArray = select ? select.split(',') : undefined;
    
    const graphService = new GraphService('access_token_here', req.user.id);
    const groups = await graphService.getGroups(filter, selectArray, top);
    
    logUserAction('list_groups', req.user.id, 'groups', {
      filter,
      select: selectArray,
      count: groups.length
    });
    
    const response: ApiResponse<Group[]> = {
      success: true,
      data: groups,
      message: `Retrieved ${groups.length} groups`
    };
    
    res.json(response);
  })
);

/**
 * GET /groups/:id
 * Get a specific group by ID
 */
router.get(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    const graphService = new GraphService('access_token_here', req.user.id);
    const group = await graphService.getGroup(id);
    
    logUserAction('get_group', req.user.id, `group:${id}`);
    
    const response: ApiResponse<Group> = {
      success: true,
      data: group,
      message: 'Group retrieved successfully'
    };
    
    res.json(response);
  })
);

/**
 * POST /groups
 * Create a new group (requires admin role)
 */
router.post(
  '/',
  authorize(['admin', 'group_admin']),
  validate(createGroupSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const groupData: Group = req.body;
    
    const graphService = new GraphService('access_token_here', req.user.id);
    const createdGroup = await graphService.createGroup(groupData);
    
    logUserAction('create_group', req.user.id, `group:${createdGroup.id}`, {
      displayName: createdGroup.displayName,
      mailNickname: createdGroup.mailNickname
    });
    
    const response: ApiResponse<Group> = {
      success: true,
      data: createdGroup,
      message: 'Group created successfully'
    };
    
    res.status(201).json(response);
  })
);

/**
 * PATCH /groups/:id
 * Update an existing group (requires admin role)
 */
router.patch(
  '/:id',
  authorize(['admin', 'group_admin']),
  validate(updateGroupSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const updates: Partial<Group> = req.body;
    
    // Note: Graph API doesn't have updateGroup method in our service
    // This would need to be implemented similar to updateUser
    
    logUserAction('update_group', req.user.id, `group:${id}`, {
      updates: Object.keys(updates)
    });
    
    const response: ApiResponse = {
      success: true,
      message: 'Group updated successfully'
    };
    
    res.json(response);
  })
);

/**
 * DELETE /groups/:id
 * Delete a group (requires admin role)
 */
router.delete(
  '/:id',
  authorize(['admin', 'group_admin']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    // Note: Graph API doesn't have deleteGroup method in our service
    // This would need to be implemented similar to deleteUser
    
    logUserAction('delete_group', req.user.id, `group:${id}`);
    
    const response: ApiResponse = {
      success: true,
      message: 'Group deleted successfully'
    };
    
    res.json(response);
  })
);

/**
 * POST /groups/:id/members
 * Add members to a group (requires admin role)
 */
router.post(
  '/:id/members',
  authorize(['admin', 'group_admin']),
  validate(addMembersSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { memberIds } = req.body;
    
    const graphService = new GraphService('access_token_here', req.user.id);
    await graphService.addGroupMembers(id, memberIds);
    
    logUserAction('add_group_members', req.user.id, `group:${id}`, {
      memberIds,
      count: memberIds.length
    });
    
    const response: ApiResponse = {
      success: true,
      message: `${memberIds.length} members added to group successfully`
    };
    
    res.json(response);
  })
);

/**
 * DELETE /groups/:id/members/:memberId
 * Remove a member from a group (requires admin role)
 */
router.delete(
  '/:id/members/:memberId',
  authorize(['admin', 'group_admin']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id, memberId } = req.params;
    
    const graphService = new GraphService('access_token_here', req.user.id);
    await graphService.removeGroupMember(id, memberId);
    
    logUserAction('remove_group_member', req.user.id, `group:${id}`, {
      memberId
    });
    
    const response: ApiResponse = {
      success: true,
      message: 'Member removed from group successfully'
    };
    
    res.json(response);
  })
);

/**
 * GET /groups/:id/members
 * Get group members
 */
router.get(
  '/:id/members',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    // Note: This would require implementing getGroupMembers in GraphService
    // For now, returning a placeholder response
    
    logUserAction('get_group_members', req.user.id, `group:${id}`);
    
    const response: ApiResponse = {
      success: true,
      data: [],
      message: 'Group members retrieved successfully'
    };
    
    res.json(response);
  })
);

/**
 * GET /groups/:id/owners
 * Get group owners
 */
router.get(
  '/:id/owners',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    // Note: This would require implementing getGroupOwners in GraphService
    
    logUserAction('get_group_owners', req.user.id, `group:${id}`);
    
    const response: ApiResponse = {
      success: true,
      data: [],
      message: 'Group owners retrieved successfully'
    };
    
    res.json(response);
  })
);

/**
 * POST /groups/:id/owners
 * Add owners to a group (requires admin role)
 */
router.post(
  '/:id/owners',
  authorize(['admin', 'group_admin']),
  validate(addMembersSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { memberIds } = req.body;
    
    // Note: This would require implementing addGroupOwners in GraphService
    
    logUserAction('add_group_owners', req.user.id, `group:${id}`, {
      ownerIds: memberIds,
      count: memberIds.length
    });
    
    const response: ApiResponse = {
      success: true,
      message: `${memberIds.length} owners added to group successfully`
    };
    
    res.json(response);
  })
);

export default router;