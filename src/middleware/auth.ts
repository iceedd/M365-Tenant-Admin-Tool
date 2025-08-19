import { Request, Response, NextFunction } from 'express';
import { AuthUser } from '../types/index';
import AuthService from '../services/authService';
import GraphService from '../services/graphService';
import logger, { logSecurityEvent } from '../utils/logger';

// Define the AuthenticatedRequest interface directly in this file
export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
  graphAccessToken?: string;
}

const authService = new AuthService();

/**
 * Authentication middleware to verify JWT tokens
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logSecurityEvent('auth_missing_token', undefined, req.ip);
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization header'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const decoded = authService.verifyJWT(token);
      
      // Check if token is expired
      if (authService.isTokenExpired(new Date(decoded.expiresOn))) {
        logSecurityEvent('auth_token_expired', decoded.userId, req.ip);
        res.status(401).json({
          success: false,
          error: 'TOKEN_EXPIRED',
          message: 'Access token has expired'
        });
        return;
      }

      // Attach user to request
      (req as AuthenticatedRequest).user = {
        id: decoded.userId,
        displayName: decoded.displayName,
        userPrincipalName: decoded.userPrincipalName,
        roles: decoded.roles,
        accessToken: '', // Don't store access token in JWT for security
        expiresOn: new Date(decoded.expiresOn)
      };

      next();
    } catch (jwtError: any) {
      logSecurityEvent('auth_invalid_token', undefined, req.ip, {
        error: jwtError.message
      });
      
      res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid or malformed token'
      });
      return;
    }
  } catch (error: any) {
    logger.error('Authentication middleware error', {
      error: error.message,
      stack: error.stack,
      ip: req.ip
    });
    
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Authentication service error'
    });
  }
};

/**
 * Authorization middleware to check user permissions
 */
export const authorize = (requiredRoles: string | string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;
      
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User not authenticated'
        });
        return;
      }

      const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      
      if (!authService.hasAnyPermission(user.roles, rolesArray)) {
        logSecurityEvent('auth_insufficient_permissions', user.id, req.ip, {
          requiredRoles: rolesArray,
          userRoles: user.roles
        });
        
        res.status(403).json({
          success: false,
          error: 'FORBIDDEN',
          message: 'Insufficient permissions'
        });
        return;
      }

      next();
    } catch (error: any) {
      logger.error('Authorization middleware error', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        ip: req.ip
      });
      
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Authorization service error'
      });
    }
  };
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = authService.verifyJWT(token);
      
      if (!authService.isTokenExpired(new Date(decoded.expiresOn))) {
        (req as AuthenticatedRequest).user = {
          id: decoded.userId,
          displayName: decoded.displayName,
          userPrincipalName: decoded.userPrincipalName,
          roles: decoded.roles,
          accessToken: '',
          expiresOn: new Date(decoded.expiresOn)
        };
      }
    } catch (jwtError) {
      // Ignore JWT errors in optional auth
      logger.debug('Optional auth JWT verification failed', {
        error: jwtError
      });
    }

    next();
  } catch (error: any) {
    logger.error('Optional authentication middleware error', {
      error: error.message,
      stack: error.stack,
      ip: req.ip
    });
    
    next(); // Continue without authentication in case of errors
  }
};

/**
 * Middleware to extract and validate Graph API access token
 */
export const graphAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'User not authenticated'
      });
      return;
    }

    // In a real implementation, you would:
    // 1. Retrieve the stored access token for this user (from database/cache)
    // 2. Check if it's expired and refresh if needed
    // 3. Attach the valid access token to the request
    
    // For now, we'll assume the access token is stored securely elsewhere
    // and retrieved based on the user ID
    
    // Example:
    // const storedTokens = await tokenStorage.getTokens(user.id);
    // if (authService.isTokenExpired(storedTokens.expiresOn)) {
    //   const refreshedTokens = await authService.refreshAccessToken(storedTokens.refreshToken, user.id);
    //   await tokenStorage.updateTokens(user.id, refreshedTokens);
    //   req.graphAccessToken = refreshedTokens.accessToken;
    // } else {
    //   req.graphAccessToken = storedTokens.accessToken;
    // }

    // For development purposes, we'll skip this check
    // In production, implement proper token storage and refresh logic
    
    next();
  } catch (error: any) {
    logger.error('Graph authentication middleware error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      ip: req.ip
    });
    
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Graph authentication service error'
    });
  }
};

/**
 * Rate limiting middleware specifically for authentication endpoints
 */
export const authRateLimit = (maxAttempts: number, windowMinutes: number) => {
  const attempts = new Map<string, { count: number; resetTime: number }>();
  
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;
    
    const clientAttempts = attempts.get(clientId);
    
    if (!clientAttempts || now > clientAttempts.resetTime) {
      attempts.set(clientId, {
        count: 1,
        resetTime: now + windowMs
      });
      next();
      return;
    }
    
    if (clientAttempts.count >= maxAttempts) {
      logSecurityEvent('auth_rate_limit_exceeded', undefined, req.ip, {
        attempts: clientAttempts.count,
        maxAttempts
      });
      
      res.status(429).json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: `Too many authentication attempts. Try again in ${windowMinutes} minutes.`,
        retryAfter: Math.ceil((clientAttempts.resetTime - now) / 1000)
      });
      return;
    }
    
    clientAttempts.count++;
    next();
  };
};

export default {
  authenticate,
  authorize,
  optionalAuth,
  graphAuth,
  authRateLimit
};