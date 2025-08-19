# M365 Tenant Admin Tool Implementation Checklist

## 1. Backend Configuration

### 1.1 TypeScript Configuration
- [ ] Create dedicated `tsconfig.backend.json` file
- [ ] Configure for CommonJS modules
- [ ] Set output directory to `./dist-backend`
- [ ] Include only backend-specific files
- [ ] Explicitly exclude frontend files

### 1.2 Environment Variables
- [ ] Create/verify `.env` file in project root
- [ ] Configure backend-specific variables:
  - [ ] PORT=3004
  - [ ] NODE_ENV=development
  - [ ] AZURE_CLIENT_ID
  - [ ] AZURE_CLIENT_SECRET
  - [ ] AZURE_TENANT_ID
  - [ ] AZURE_REDIRECT_URI="http://localhost:3004/auth/callback"
  - [ ] JWT_SECRET
  - [ ] SESSION_SECRET
  - [ ] GRAPH_API_ENDPOINT="https://graph.microsoft.com/v1.0"
  - [ ] GRAPH_SCOPES
  - [ ] CORS_ORIGIN="http://localhost:3004"

### 1.3 Module Resolution
- [ ] Fix imports in `src/server.ts` to use relative paths with `.ts` extensions
- [ ] Fix imports in `src/routes/` to use relative paths
- [ ] Fix imports in `src/middleware/` to use relative paths
- [ ] Fix imports in `src/services/` to use relative paths
- [ ] Fix imports in `src/utils/` to use relative paths

### 1.4 NPM Scripts
- [ ] Add `start:backend-dev` script to `package.json`

## 2. GraphService Implementation

### 2.1 GraphService Methods
- [ ] Verify/implement `getUsers` method
- [ ] Verify/implement `createGroup` method
- [ ] Verify/implement `assignLicense` method
- [ ] Verify/implement `getUsersWithLicense` method
- [ ] Verify/implement `updateGroup` method
- [ ] Verify/implement `deleteGroup` method
- [ ] Verify/implement `getGroupMembers` method
- [ ] Verify/implement `getGroupOwners` method
- [ ] Verify/implement `addGroupOwners` method

### 2.2 Authentication Service
- [ ] Fix `AuthUser` interface implementation
- [ ] Correct return type of `getAuthUrl` to `Promise<string>`
- [ ] Verify `exchangeCodeForTokens` and `refreshAccessToken` methods

### 2.3 Authentication Middleware
- [ ] Define `AuthenticatedRequest` interface in `auth.ts`
- [ ] Ensure `authenticate` middleware verifies JWT
- [ ] Ensure `graphAuth` middleware extracts Graph API token

## 3. Frontend Configuration

### 3.1 Environment Variables
- [ ] Create/verify frontend `.env` file
- [ ] Configure frontend-specific variables:
  - [ ] VITE_APP_TITLE="M365 Tenant Admin Tool"
  - [ ] VITE_API_BASE_URL="http://localhost:3004/api"
  - [ ] VITE_AZURE_CLIENT_ID
  - [ ] VITE_AZURE_TENANT_ID
  - [ ] VITE_AZURE_REDIRECT_URI="http://localhost:3004"
  - [ ] VITE_AZURE_SCOPES

### 3.2 Mock Data Removal
- [ ] Remove mock data from `src/store/api/apiSlice.ts`
- [ ] Remove mock endpoints from `src/store/api/usersApi.ts`
- [ ] Remove mock endpoints from `src/store/api/groupsApi.ts`
- [ ] Remove mock endpoints from `src/store/api/licensesApi.ts`
- [ ] Configure fetchBaseQuery with VITE_API_BASE_URL

### 3.3 Type Separation
- [ ] Move frontend-specific types from `src/types/index.ts` to a new file

## 4. Integration Testing

### 4.1 Azure AD Setup
- [ ] Verify Azure AD application registration
- [ ] Ensure proper redirect URIs are configured
- [ ] Verify API permissions are granted

### 4.2 Backend Testing
- [ ] Start backend on port 3004
- [ ] Test authentication endpoint
- [ ] Verify logging is working

### 4.3 Frontend Testing
- [ ] Start frontend development server
- [ ] Test login flow
- [ ] Verify data is fetched from Graph API
- [ ] Test CRUD operations