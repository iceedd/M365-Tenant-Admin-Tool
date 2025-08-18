import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from '@/config';
import logger from '@/utils/logger';
import routes from '@/routes';
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler';
import {
  corsOptions,
  generalRateLimit,
  helmetConfig,
  requestId,
  requestLogger,
  securityHeaders,
  compressionMiddleware
} from '@/middleware/security';

/**
 * Create and configure Express application
 */
function createApp(): express.Application {
  const app = express();

  // Trust proxy (for accurate IP addresses)
  app.set('trust proxy', 1);

  // Security middleware
  app.use(helmetConfig);
  app.use(securityHeaders);
  app.use(requestId);
  
  // CORS
  app.use(cors(corsOptions));
  
  // Rate limiting
  app.use(generalRateLimit);
  
  // Compression
  app.use(compressionMiddleware);
  
  // Body parsing middleware
  app.use(express.json({ 
    limit: '10mb',
    type: ['application/json', 'text/plain']
  }));
  app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb' 
  }));

  // HTTP request logging
  if (config.nodeEnv === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined', {
      stream: {
        write: (message: string) => {
          logger.info(message.trim(), { type: 'http_access_log' });
        }
      }
    }));
  }
  
  // Custom request logging
  app.use(requestLogger);

  // API routes
  app.use('/api', routes);

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'M365 User Provisioning Tool API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/api/health',
        auth: '/api/auth',
        users: '/api/users',
        groups: '/api/groups',
        licenses: '/api/licenses'
      }
    });
  });

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}

/**
 * Start the server
 */
async function startServer(): Promise<void> {
  try {
    const app = createApp();
    
    const server = app.listen(config.port, () => {
      logger.info(`🚀 Server started successfully`, {
        port: config.port,
        environment: config.nodeEnv,
        timestamp: new Date().toISOString()
      });
      
      if (config.nodeEnv === 'development') {
        console.log(`\n🔗 API endpoints:`);
        console.log(`   Health: http://localhost:${config.port}/api/health`);
        console.log(`   Auth:   http://localhost:${config.port}/api/auth`);
        console.log(`   Users:  http://localhost:${config.port}/api/users`);
        console.log(`   Groups: http://localhost:${config.port}/api/groups`);
        console.log(`   Licenses: http://localhost:${config.port}/api/licenses`);
        console.log(`\n📚 Environment: ${config.nodeEnv}`);
        console.log(`⚡ Ready for requests!\n`);
      }
    });

    // Graceful shutdown handling
    const gracefulShutdown = (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      server.close((err) => {
        if (err) {
          logger.error('Error during server shutdown', { error: err.message });
          process.exit(1);
        }
        
        logger.info('Server closed successfully');
        process.exit(0);
      });
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', {
        promise,
        reason: reason instanceof Error ? reason.message : reason
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', {
        error: error.message,
        stack: error.stack
      });
      process.exit(1);
    });

  } catch (error: any) {
    logger.error('Failed to start server', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

export { createApp, startServer };
export default createApp;