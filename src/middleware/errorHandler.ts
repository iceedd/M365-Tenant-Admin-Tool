import { Request, Response, NextFunction } from 'express';
import { GraphError, ApiResponse } from '../types/index';
import logger, { logError } from '../utils/logger';
import { config } from '../config/index';

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error class
 */
export class ValidationError extends AppError {
  public details: any;

  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

/**
 * Graph API error class
 */
export class GraphApiError extends AppError {
  public graphError: GraphError;

  constructor(graphError: GraphError) {
    super(graphError.message, 500, graphError.code);
    this.graphError = graphError;
  }
}

/**
 * Authentication error class
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

/**
 * Authorization error class
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

/**
 * Rate limit error class
 */
export class RateLimitError extends AppError {
  public retryAfter?: number;

  constructor(message: string = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.retryAfter = retryAfter;
  }
}

/**
 * Convert various error types to standardized API response
 */
const formatErrorResponse = (error: any, req: Request): ApiResponse => {
  // Application errors
  if (error instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      error: error.code,
      message: error.message
    };

    // Add additional fields for specific error types
    if (error instanceof ValidationError && error.details) {
      response.data = { validationDetails: error.details };
    }

    if (error instanceof RateLimitError && error.retryAfter) {
      response.data = { retryAfter: error.retryAfter };
    }

    return response;
  }

  // Graph API errors
  if (error.code && error.message) {
    return {
      success: false,
      error: error.code,
      message: error.message
    };
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return {
      success: false,
      error: 'INVALID_TOKEN',
      message: 'Invalid authentication token'
    };
  }

  if (error.name === 'TokenExpiredError') {
    return {
      success: false,
      error: 'TOKEN_EXPIRED',
      message: 'Authentication token has expired'
    };
  }

  // Validation errors (Joi)
  if (error.isJoi) {
    return {
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      data: {
        validationDetails: error.details.map((detail: any) => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }))
      }
    };
  }

  // Default error response
  return {
    success: false,
    error: 'INTERNAL_ERROR',
    message: config.nodeEnv === 'production' 
      ? 'An internal server error occurred' 
      : error.message || 'Unknown error occurred'
  };
};

/**
 * Global error handling middleware
 */
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log the error
  const userId = (req as any).user?.id;
  logError(error, `${req.method} ${req.path}`, userId, {
    body: req.body,
    query: req.query,
    params: req.params,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Determine status code
  let statusCode = 500;
  if (error instanceof AppError) {
    statusCode = error.statusCode;
  } else if (error.status) {
    statusCode = error.status;
  } else if (error.statusCode) {
    statusCode = error.statusCode;
  }

  // Format error response
  const errorResponse = formatErrorResponse(error, req);

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * 404 handler for unknown routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new NotFoundError(`Route ${req.method} ${req.path}`);
  next(error);
};

/**
 * Async wrapper to catch errors in async route handlers
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validation middleware wrapper
 */
export const validate = (schema: any, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      next(new ValidationError('Request validation failed', error.details));
      return;
    }

    // Replace the original property with the validated value
    req[property] = value;
    next();
  };
};

/**
 * Global unhandled promise rejection handler
 */
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise: promise.toString()
  });
  
  // In production, you might want to gracefully shut down
  if (config.nodeEnv === 'production') {
    process.exit(1);
  }
});

/**
 * Global uncaught exception handler
 */
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  
  // Always exit on uncaught exceptions
  process.exit(1);
});

export default {
  AppError,
  ValidationError,
  GraphApiError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  validate
};