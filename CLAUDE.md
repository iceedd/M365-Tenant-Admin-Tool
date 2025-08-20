# M365 Tenant Admin Tool - Claude Helper

This document contains key information that Claude will use to assist with the M365 Tenant Admin Tool project.

## Project Overview

The M365 Tenant Admin Tool is a full-stack application with:
- React/Vite frontend
- Node.js/Express backend
- Microsoft Graph API integration

The backend primarily acts as a testing proxy for forwarding requests to the Microsoft Graph API and handling authentication.

## Core Issues to Address

1. **Mock Data Replacement**
   - The application currently uses mock data instead of live Microsoft Graph API data
   - Need to remove all mock endpoints and data sources
   - Ensure proper integration with real tenant data through the Graph API

2. **Frontend/Backend Configuration Separation**
   - Clear separation needed between frontend and backend compilation contexts
   - Dedicated TypeScript configurations required for each

3. **Module Resolution**
   - Replace path aliases (@/) with relative imports using explicit .ts extensions
   - Avoid ES Modules vs. CommonJS ambiguity

4. **Environment Variables**
   - Frontend: Use `import.meta.env` (Vite)
   - Backend: Use `process.env` via `dotenv`
   - Ensure proper environment variables are set for Azure AD integration

5. **Authentication Flow**
   - MSAL.js for frontend authentication
   - Exchange authorization code for tokens with backend
   - Ensure proper Graph API token handling in middleware

## Suggested Actions

### Frontend Changes
1. Remove all mock data and endpoints from Redux store slices
2. Create/verify `.env` file with frontend variables
3. Verify authentication flow in MSAL components
4. Ensure Redux Toolkit Query is correctly configured to use real backend endpoints
5. Isolate frontend-specific types

### Backend Changes
1. Create dedicated `tsconfig.backend.json`
2. Refactor imports to use relative paths with `.ts` extensions
3. Update npm scripts for backend
4. Implement any missing GraphService methods for Microsoft Graph API integration
5. Verify authentication and Graph API service implementation
6. Ensure all routes correctly use GraphService instead of mock data

### Integration Testing
1. Set up Azure AD application with proper permissions
2. Configure environment variables for both frontend and backend
3. Test authentication flow and API requests

## Key Files

- `src/config/index.ts`: Backend configuration
- `src/middleware/auth.ts`: Authentication middleware
- `src/services/authService.ts`: Azure AD authentication
- `src/services/graphService.ts`: Microsoft Graph API integration
- `src/store/api/apiSlice.ts`: Redux Toolkit Query setup
- `src/store/api/usersApi.ts`: User-related API endpoints
- `src/store/api/groupsApi.ts`: Group-related API endpoints
- `src/store/api/licensesApi.ts`: License-related API endpoints

## Commands to Run

For local development:
```bash
# Install dependencies
npm install

# Start backend
npm run start:backend-dev

# Start frontend (in a separate terminal)
npm run dev
```

## Error Handling Strategy

1. Verify TypeScript compilation before runtime
2. Use explicit error checking in GraphService methods
3. Return standardized ApiResponse objects from all route handlers
4. Implement proper error logging