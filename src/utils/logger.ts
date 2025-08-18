import winston from 'winston';
import { config } from '@/config';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logDir = path.dirname(config.logging.file);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports: [
    // File transport
    new winston.transports.File({
      filename: config.logging.file,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    
    // Error file transport
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    })
  ],
  
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log')
    })
  ],
  
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log')
    })
  ]
});

// Add console transport for development
if (config.nodeEnv === 'development') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ timestamp, level, message, stack }) => {
        let log = `${timestamp} [${level}]: ${message}`;
        if (stack) {
          log += `\n${stack}`;
        }
        return log;
      })
    )
  }));
}

export default logger;

// Helper functions for structured logging
export const logGraphApiCall = (
  method: string,
  endpoint: string,
  statusCode: number,
  duration: number,
  userId?: string
) => {
  logger.info('Graph API call', {
    method,
    endpoint,
    statusCode,
    duration,
    userId,
    type: 'graph_api_call'
  });
};

export const logUserAction = (
  action: string,
  userId: string,
  targetResource: string,
  details?: any
) => {
  logger.info('User action', {
    action,
    userId,
    targetResource,
    details,
    type: 'user_action'
  });
};

export const logSecurityEvent = (
  event: string,
  userId?: string,
  ipAddress?: string,
  details?: any
) => {
  logger.warn('Security event', {
    event,
    userId,
    ipAddress,
    details,
    type: 'security_event'
  });
};

export const logError = (
  error: Error,
  context?: string,
  userId?: string,
  details?: any
) => {
  logger.error('Application error', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    context,
    userId,
    details,
    type: 'application_error'
  });
};