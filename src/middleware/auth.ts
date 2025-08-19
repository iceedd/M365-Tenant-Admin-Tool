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

// In-memory token storage (for development - use Redis/database in production)
const tokenStorage = new Map<string, { accessToken: string; refreshToken?: string; expiresOn: Date }>();

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

    // Get stored tokens for this user
    const storedTokens = tokenStorage.get(user.id);
    
    if (!storedTokens) {
      logger.warn('No stored access token found for user', { userId: user.id });
      res.status(401).json({
        success: false,
        error: 'NO_ACCESS_TOKEN',
        message: 'No access token available. Please re-authenticate.'
      });
      return;
    }

    // Check if token is expired and refresh if needed
    if (authService.isTokenExpired(storedTokens.expiresOn)) {
      if (storedTokens.refreshToken) {
        try {
          const refreshedUser = await authService.refreshAccessToken(storedTokens.refreshToken, user.id);
          
          // Update stored tokens
          tokenStorage.set(user.id, {
            accessToken: refreshedUser.accessToken,
            refreshToken: refreshedUser.refreshToken || storedTokens.refreshToken,
            expiresOn: refreshedUser.expiresOn
          });
          
          req.graphAccessToken = refreshedUser.accessToken;
          logger.info('Access token refreshed successfully', { userId: user.id });
        } catch (refreshError: any) {
          logger.error('Token refresh failed', { userId: user.id, error: refreshError.message });
          res.status(401).json({
            success: false,
            error: 'TOKEN_REFRESH_FAILED',
            message: 'Unable to refresh access token. Please re-authenticate.'
          });
          return;
        }
      } else {
        res.status(401).json({
          success: false,
          error: 'TOKEN_EXPIRED',
          message: 'Access token expired and no refresh token available. Please re-authenticate.'
        });
        return;
      }
    } else {
      req.graphAccessToken = storedTokens.accessToken;
    }
    
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
 * Store access token for a user (helper function)
 */
export const storeUserTokens = (userId: string, accessToken: string, refreshToken?: string, expiresOn?: Date): void => {
  tokenStorage.set(userId, {
    accessToken,
    refreshToken,
    expiresOn: expiresOn || new Date(Date.now() + 3600000) // 1 hour default
  });
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