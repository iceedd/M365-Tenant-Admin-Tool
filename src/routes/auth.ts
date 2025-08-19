import { Router, Request, Response } from 'express';
import AuthService from '../services/authService';
import { asyncHandler, validate } from '../middleware/errorHandler';
import { authRateLimit } from '../middleware/auth';
import { ApiResponse } from '../types/index';
import Joi from 'joi';
import logger from '../utils/logger';

const router = Router();
const authService = new AuthService();

// Validation schemas
const callbackSchema = Joi.object({
  code: Joi.string().required(),
  state: Joi.string().optional()
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required()
});

/**
 * GET /auth/login
 * Initiate OAuth login flow
 */
router.get('/login', asyncHandler(async (req: Request, res: Response) => {
  const state = req.query.state as string;
  const authUrl = authService.getAuthUrl(state);
  
  const response: ApiResponse = {
    success: true,
    data: {
      authUrl,
      message: 'Redirect to this URL to complete authentication'
    }
  };
  
  res.json(response);
}));

/**
 * POST /auth/callback
 * Handle OAuth callback and exchange code for tokens
 */
router.post(
  '/callback',
  authRateLimit(5, 15), // 5 attempts per 15 minutes
  validate(callbackSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { code, state } = req.body;
    const ipAddress = req.ip;
    
    // Exchange authorization code for tokens
    const authUser = await authService.exchangeCodeForTokens(code, state, ipAddress);
    
    // Get user roles from Graph API
    authUser.roles = await authService.getUserRoles(authUser.accessToken);
    
    // Generate JWT for session management
    const sessionToken = authService.generateJWT(authUser);
    
    const response: ApiResponse = {
      success: true,
      data: {
        user: {
          id: authUser.id,
          displayName: authUser.displayName,
          userPrincipalName: authUser.userPrincipalName,
          roles: authUser.roles
        },
        token: sessionToken,
        expiresOn: authUser.expiresOn
      },
      message: 'Authentication successful'
    };
    
    logger.info('User authenticated successfully', {
      userId: authUser.id,
      userPrincipalName: authUser.userPrincipalName,
      ip: ipAddress
    });
    
    res.json(response);
  })
);

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
router.post(
  '/refresh',
  authRateLimit(10, 15), // 10 attempts per 15 minutes
  validate(refreshSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const userId = req.body.userId; // Should be included in request
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_USER_ID',
        message: 'User ID is required for token refresh'
      });
    }
    
    // Refresh the access token
    const authUser = await authService.refreshAccessToken(refreshToken, userId);
    
    // Get updated user roles
    authUser.roles = await authService.getUserRoles(authUser.accessToken);
    
    // Generate new JWT
    const sessionToken = authService.generateJWT(authUser);
    
    const response: ApiResponse = {
      success: true,
      data: {
        user: {
          id: authUser.id,
          displayName: authUser.displayName,
          userPrincipalName: authUser.userPrincipalName,
          roles: authUser.roles
        },
        token: sessionToken,
        expiresOn: authUser.expiresOn
      },
      message: 'Token refreshed successfully'
    };
    
    res.json(response);
  })
);

/**
 * POST /auth/logout
 * Logout user and invalidate session
 */
router.post('/logout', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.body.userId;
  const ipAddress = req.ip;
  
  if (userId) {
    await authService.logout(userId, ipAddress);
  }
  
  const response: ApiResponse = {
    success: true,
    message: 'Logout successful'
  };
  
  res.json(response);
}));

/**
 * GET /auth/status
 * Check authentication status (requires valid JWT)
 */
router.get('/status', asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'No valid authentication token provided'
    });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = authService.verifyJWT(token);
    
    // Check if token is expired
    if (authService.isTokenExpired(new Date(decoded.expiresOn))) {
      return res.status(401).json({
        success: false,
        error: 'TOKEN_EXPIRED',
        message: 'Authentication token has expired'
      });
    }
    
    const response: ApiResponse = {
      success: true,
      data: {
        user: {
          id: decoded.userId,
          displayName: decoded.displayName,
          userPrincipalName: decoded.userPrincipalName,
          roles: decoded.roles
        },
        expiresOn: decoded.expiresOn,
        isValid: true
      },
      message: 'Authentication status verified'
    };
    
    res.json(response);
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      error: 'INVALID_TOKEN',
      message: 'Invalid authentication token'
    });
  }
}));

export default router;