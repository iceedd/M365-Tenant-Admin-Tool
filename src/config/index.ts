import dotenv from 'dotenv';
import { AppConfig } from '@/types';

// Load environment variables
dotenv.config();

const requiredEnvVars = [
  'AZURE_CLIENT_ID',
  'AZURE_TENANT_ID',
  'JWT_SECRET',
  'SESSION_SECRET'
];

// Validate required environment variables
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '3004', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  azureAd: {
    clientId: process.env.AZURE_CLIENT_ID!,
    clientSecret: process.env.AZURE_CLIENT_SECRET || 'dummy-secret-for-local-dev',
    tenantId: process.env.AZURE_TENANT_ID!,
    redirectUri: process.env.AZURE_REDIRECT_URI || 'http://localhost:3004/auth/callback'
  },
  
  graphApi: {
    endpoint: process.env.GRAPH_API_ENDPOINT || 'https://graph.microsoft.com/v1.0',
    scopes: process.env.GRAPH_SCOPES?.split(',') || ['https://graph.microsoft.com/.default']
  },
  
  jwt: {
    jwtSecret: process.env.JWT_SECRET!,
    sessionSecret: process.env.SESSION_SECRET!
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log'
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3004'
  }
};

export default config;