import { Configuration, LogLevel } from '@azure/msal-browser';

// Azure AD configuration
export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || '',
    authority: 'https://login.microsoftonline.com/organizations',
    redirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI || 'http://localhost:3000',
    postLogoutRedirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI || 'http://localhost:3000',
  },
  cache: {
    cacheLocation: 'sessionStorage', // More secure than localStorage
    storeAuthStateInCookie: false, // Set to true for IE11 or Edge legacy
  },
  system: {
    loggerOptions: {
      loggerCallback: (level: LogLevel, message: string, containsPii: boolean) => {
        if (import.meta.env.VITE_DEBUG_MODE === 'true') {
          if (containsPii) {
            return;
          }
          switch (level) {
            case LogLevel.Error:
              console.error(`MSAL Error: ${message}`);
              return;
            case LogLevel.Warning:
              console.warn(`MSAL Warning: ${message}`);
              return;
            case LogLevel.Info:
              console.info(`MSAL Info: ${message}`);
              return;
            case LogLevel.Verbose:
              console.debug(`MSAL Verbose: ${message}`);
              return;
          }
        }
      }
    }
  }
};

// Microsoft Graph API scopes
export const loginRequest = {
  scopes: (import.meta.env.VITE_AZURE_SCOPES || 'User.Read').split(' '),
  prompt: 'select_account', // Force account selection
};

// Additional scopes for specific operations
export const graphScopes = {
  // User management
  users: ['User.Read.All', 'User.ReadWrite.All'],
  
  // Group management  
  groups: ['Group.Read.All', 'Group.ReadWrite.All'],
  
  // Directory operations
  directory: ['Directory.Read.All', 'Directory.ReadWrite.All'],
  
  // Organization and licensing
  organization: ['Organization.Read.All'],
  
  // Audit logs and reports
  auditLogs: ['AuditLog.Read.All'],
  reports: ['Reports.Read.All'],
  
  // Role management
  roles: ['RoleManagement.Read.Directory'],
};

// Graph API endpoints
export const graphEndpoints = {
  users: 'https://graph.microsoft.com/v1.0/users',
  groups: 'https://graph.microsoft.com/v1.0/groups',
  organization: 'https://graph.microsoft.com/v1.0/organization',
  subscribedSkus: 'https://graph.microsoft.com/v1.0/subscribedSkus',
  auditLogs: 'https://graph.microsoft.com/v1.0/auditLogs/directoryAudits',
  me: 'https://graph.microsoft.com/v1.0/me',
  directoryRoles: 'https://graph.microsoft.com/v1.0/directoryRoles',
  applications: 'https://graph.microsoft.com/v1.0/applications',
};

// Validate configuration
export const validateAzureConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!import.meta.env.VITE_AZURE_CLIENT_ID) {
    errors.push('VITE_AZURE_CLIENT_ID is required');
  }
  
  if (!import.meta.env.VITE_AZURE_TENANT_ID) {
    errors.push('VITE_AZURE_TENANT_ID is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};