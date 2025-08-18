# Detailed Plan for Local Development Setup & Full Functionality of M365 Tenant Admin Tool

## 1. Introduction & Project Overview

This document outlines a comprehensive plan to make the M365 Tenant Admin Tool a fully functional web application running locally, integrated with live Microsoft Graph API data. It is intended for review by "Claude Code" to assess the necessary changes and their rationale.

The M365 Tenant Admin Tool is a full-stack application comprising a React/Vite frontend and a Node.js/Express backend. Its core purpose is to provide a user-friendly interface for managing Microsoft 365 users, groups, and licenses. For this local setup, the backend is primarily intended to act as a **testing proxy**, forwarding requests to the Microsoft Graph API and handling authentication, rather than implementing complex business logic or persistent storage.

## 2. Core Principles for Local Development

To ensure a smooth and maintainable local development environment, the following principles will guide the proposed changes:

*   **Clear Separation of Concerns:** Frontend and backend codebases, configurations, and environment variable handling will be distinctly separated to avoid conflicts and improve clarity.
*   **Consistent Environment Variable Management:** Environment variables will be managed consistently across both frontend (using `import.meta.env` via Vite) and backend (using `process.env` via `dotenv`).
*   **Robust Module Resolution:** Import paths will be explicit and relative where possible to minimize reliance on complex alias resolution mechanisms that can cause runtime issues.
*   **Comprehensive Error Handling:** Ensure errors are caught, logged, and presented clearly to the user and developers.

## 3. Frontend (React/Vite) - Required Changes

The frontend is built with React and Vite. The following changes and verifications are crucial for its local functionality:

### 3.1 Environment Variables (`.env`, `import.meta.env`)

Ensure the frontend correctly accesses environment variables provided by Vite:

*   **Action:** Verify or create a `.env` file in the project root (e.g., by copying `/.env.example`).
*   **Configuration:** Populate this `.env` file with the following variables, replacing placeholders with your specific values:

    ```env
    VITE_APP_TITLE="M365 Tenant Admin Tool"
    VITE_API_BASE_URL="http://localhost:3004/api" # Points to your local backend
    VITE_AZURE_CLIENT_ID="YOUR_FRONTEND_AZURE_CLIENT_ID"
    VITE_AZURE_TENANT_ID="YOUR_AZURE_TENANT_ID"
    VITE_AZURE_REDIRECT_URI="http://localhost:3004" # Must match Azure AD app registration
    VITE_DEBUG_MODE="true"
    VITE_AZURE_SCOPES="User.Read User.Read.All Group.Read.All Directory.Read.All" # Add more as needed
    ```

*   **Verification:** Confirm that `src/config/azureConfig.ts` and other frontend files correctly use `import.meta.env.VITE_...` to access these variables.

### 3.2 Authentication Flow (MSAL)

The frontend uses Microsoft Authentication Library (MSAL) for user authentication with Azure AD.

*   **Verification:**
    *   **`src/hooks/useAuth.ts`**: Ensure this hook correctly initializes MSAL, handles login/logout, and manages the authentication state.
    *   **`src/components/auth/LoginForm.tsx`**: Verify it initiates the MSAL login redirect.
    *   **`src/components/auth/OAuthCallback.tsx`**: Confirm it processes the authorization code received from Azure AD and sends it to the backend for token exchange.
    *   **Scope Management:** Ensure the necessary Microsoft Graph API scopes are requested during the MSAL login process to allow the backend to make Graph API calls on behalf of the user.

### 3.3 API Calls (Redux Toolkit Query)

The frontend uses Redux Toolkit Query for data fetching and state management.

*   **Verification:**
    *   **`src/store/api/apiSlice.ts`**: Ensure `fetchBaseQuery` is configured with `VITE_API_BASE_URL` to point to your local backend. It should also prepare headers to include the JWT token for authenticated requests.
    *   **`src/store/api/*.ts` (e.g., `usersApi.ts`, `groupsApi.ts`, `licensesApi.ts`)**: Verify these API slices are correctly defined to make requests to the backend endpoints (e.g., `/api/users`, `/api/groups`).
    *   **Mock Data Removal:** Confirm that any remaining mock data or placeholder logic has been removed from these API slices, relying solely on the backend for data.

### 3.4 Component Integration

React components should correctly display and interact with live data.

*   **Verification:**
    *   **Data Consumption:** Ensure components like `UserList`, `GroupManagement`, `LicenseList`, and `DashboardOverview` correctly use Redux Toolkit Query hooks (e.g., `useGetUsersQuery`) to fetch and display data.
    *   **Loading & Error States:** Implement or verify proper handling of loading states, error displays, and empty data scenarios.
    *   **User Interactions:** Confirm that forms and interactive elements (e.g., create, update, delete buttons) correctly trigger mutations via RTK Query, sending data to the backend.

### 3.5 Frontend-Specific Types

To maintain a clean separation and avoid compilation issues in the backend, frontend-specific types should be isolated.

*   **Action:** Move types that are exclusively used by the frontend (e.g., `FormFieldConfig`, `TableColumn`, `TableProps`, `ThemeMode`, `NavItem`, and any types that directly reference `React.ReactNode`) from `src/types/index.ts` to a new, dedicated frontend types file (e.g., `src/types/frontend.ts`).
*   **Verification:** Ensure `src/types/index.ts` only contains types relevant to both frontend and backend, or exclusively to the backend.

## 4. Backend (Node.js/Express) - Required Changes

The backend is built with Node.js and Express.js. This section details the critical changes needed for its local functionality and integration with the Graph API.

### 4.1 Environment Variables (`.env`, `process.env`, `dotenv`)

The backend must correctly load and use its environment variables.

*   **Action:** Create or verify a `.env` file in the project root (if not present, copy from `.env.example`).
*   **Configuration:** Populate this `.env` file with the following backend-specific variables:

    ```env
    PORT=3004
    NODE_ENV=development
    AZURE_CLIENT_ID="YOUR_BACKEND_AZURE_CLIENT_ID" # Often same as frontend, but can be different
    AZURE_CLIENT_SECRET="YOUR_BACKEND_AZURE_CLIENT_SECRET" # Crucial for confidential client app
    AZURE_TENANT_ID="YOUR_AZURE_TENANT_ID"
    AZURE_REDIRECT_URI="http://localhost:3004/auth/callback" # Backend callback URL
    JWT_SECRET="YOUR_STRONG_JWT_SECRET" # Generate a strong random string
    SESSION_SECRET="YOUR_STRONG_SESSION_SECRET" # Generate a strong random string
    GRAPH_API_ENDPOINT="https://graph.microsoft.com/v1.0"
    GRAPH_SCOPES="User.Read User.Read.All Group.Read.All Directory.Read.All" # Match frontend scopes
    LOG_LEVEL=info
    LOG_FILE=logs/app.log
    RATE_LIMIT_WINDOW_MS=900000
    RATE_LIMIT_MAX_REQUESTS=100
    CORS_ORIGIN="http://localhost:3004" # Your frontend's URL
    ```

*   **Verification:**
    *   **`src/config/index.ts`**: Ensure this file correctly uses `dotenv.config()` to load variables and accesses them via `process.env.VARIABLE_NAME`. It should also validate that all required environment variables are present.
    *   **Property Naming:** Verify that the `config` object in `src/config/index.ts` uses `azureAd` (not `azure`), `graphApi` (not `graph`), and `jwt` (not `security`) to match the `AppConfig` interface.

### 4.2 Module Resolution (Relative Imports)

To avoid complex runtime module resolution issues (like those encountered with `@/` aliases and ES Modules), all backend imports should be relative.

*   **Action:** Go through every backend `.ts` file (in `src/server.ts`, `src/routes/`, `src/middleware/`, `src/services/`, `src/utils/`) and change all imports that use `@/` aliases to **relative paths with explicit `.ts` extensions**.
*   **Example:**
    *   Change `import { config } from '@/config';` to `import { config } from './config/index.ts';` (if importing `src/config/index.ts` from `src/server.ts`).
    *   Change `import { AuthUser } from '@/types';` to `import { AuthUser } from '../types/index.ts';` (if importing `src/types/index.ts` from `src/middleware/auth.ts`).
    *   Adjust paths based on the relative location of the importing and imported files.

### 4.3 TypeScript Compilation (`tsconfig.backend.json`)

A dedicated TypeScript configuration is needed for the backend to ensure proper compilation without interference from frontend-specific code.

*   **Action:** Create a `tsconfig.backend.json` file in the project root.
*   **Configuration:**

    ```json
    {
      "compilerOptions": {
        "target": "ES2020",
        "module": "CommonJS", // Use CommonJS for Node.js backend
        "outDir": "./dist-backend", // Output compiled JS here
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "baseUrl": ".",
        "paths": {
          "@/*": ["src/*"] // Keep for IDE support, but runtime will use relative paths
        },
        "types": ["node"] // Include Node.js types
      },
      "include": [
        "src/server.ts",
        "src/config/index.ts",
        "src/middleware/**/*.ts",
        "src/routes/**/*.ts",
        "src/services/authService.ts",
        "src/services/graphService.ts",
        "src/types/**/*.ts",
        "src/utils/**/*.ts"
      ],
      "exclude": [
        "node_modules",
        "dist",
        "dist-backend",
        "src/components",
        "src/pages",
        "src/store",
        "src/hooks",
        "src/config/azureConfig.ts", // Exclude frontend-specific config
        "src/services/graphApiService.ts", // Exclude frontend-specific service
        "src/utils/theme.ts" // Exclude frontend-specific utility
      ]
    }
    ```

*   **Verification:** Ensure this file correctly includes all backend source files and explicitly excludes frontend-only files and directories.

### 4.4 Running the Server Locally (`package.json` scripts)

Define a convenient script to build and run the backend.

*   **Action:** Add the following script to the `"scripts"` section of your `package.json`:

    ```json
    "start:backend-dev": "ts-node -P tsconfig.backend.json src/server.ts"
    ```

*   **Verification:** This script will use `ts-node` with the specific `tsconfig.backend.json` to run your `src/server.ts` file directly, without a separate compilation step during development.

### 4.5 Authentication & Authorization

This is a critical part of the backend's functionality, handling user authentication and token management.

*   **`src/middleware/auth.ts`**:
    *   **Action:** Define the `AuthenticatedRequest` interface directly within this file, as it's a core part of the middleware's contract:

        ```typescript
        import { Request } from 'express';
        import { AuthUser } from '../types/index.ts'; // Relative import

        export interface AuthenticatedRequest extends Request {
          user?: AuthUser;
          graphAccessToken?: string;
        }
        ```

    *   **Verification:** Ensure `authenticate` middleware correctly verifies the backend-generated JWT and attaches the `AuthUser` to `req.user`. The `graphAuth` middleware must correctly extract the *Microsoft Graph API access token* from the `Authorization` header and attach it to `req.graphAccessToken`.

*   **`src/services/authService.ts`**:
    *   **Verification:**
        *   Confirm `AuthService` uses `config.azureAd.clientId`, `config.graphApi.scopes`, `config.jwt.secret`, etc., from `src/config/index.ts`.
        *   **Action:** Review `exchangeCodeForTokens` and `refreshAccessToken` methods. Ensure that when creating the `AuthUser` object, it only includes properties defined in `src/types/index.ts` (`id`, `email`, `name`, `displayName`, `userPrincipalName`, `roles`). Properties like `accessToken`, `refreshToken`, and `expiresOn` should *not* be assigned to the `AuthUser` object itself, as they are part of the session token or MSAL's internal state.
        *   **Action:** Correct the return type of `getAuthUrl` to `Promise<string>` as it performs an asynchronous operation.

### 4.6 Microsoft Graph API Integration

The backend's primary role is to interact with the Microsoft Graph API.

*   **`src/services/graphService.ts`**:
    *   **Verification:** Confirm `GraphService` correctly initializes `@microsoft/microsoft-graph-client` with the `accessToken` provided by the `graphAuth` middleware.
    *   **Action:** Ensure all methods (`getUsers`, `createGroup`, `assignLicense`, `getUsersWithLicense`, `updateGroup`, `deleteGroup`, `getGroupMembers`, `getGroupOwners`, `addGroupOwners`, etc.) are fully implemented to make correct calls to the Microsoft Graph API endpoints.

*   **Route Handlers (`src/routes/*.ts`)**:
    *   **Verification:** Ensure all route handlers (e.g., in `src/routes/users.ts`, `src/routes/groups.ts`, `src/routes/licenses.ts`) correctly initialize `GraphService` with `req.graphAccessToken` and `req.user.id`.
    *   **Action:** Add checks to ensure `req.user` is defined before accessing its properties (e.g., `req.user!.id` or `if (req.user) { ... }`) to prevent `TS18048` errors.
    *   **Verification:** Confirm that all CRUD operations and data retrieval endpoints correctly call the corresponding `GraphService` methods and return standardized `ApiResponse` objects.

### 4.7 Error Handling & Logging

Robust error handling and logging are essential for debugging and maintaining the application.

*   **`src/middleware/errorHandler.ts`**:
    *   **Verification:** Ensure this middleware correctly catches and formats various types of errors (application errors, Graph API errors, JWT errors, validation errors) into a standardized `ApiResponse` format.
    *   **Verification:** Confirm that errors are logged appropriately using `logger.error`.

*   **`src/utils/logger.ts`**:
    *   **Verification:** Ensure the logger is correctly configured (e.g., using Winston) to output logs to the console and/or a file (`logs/app.log`).

### 4.8 Security Middleware (`src/middleware/security.ts`)

Review and verify the security middleware for local development.

*   **Verification:**
    *   **`corsOptions`**: Ensure CORS is configured to allow requests from your frontend's local development URL (e.g., `http://localhost:3004`).
    *   **Rate Limiting (`generalRateLimit`, `strictRateLimit`)**: Verify these are correctly configured with appropriate `windowMs` and `max` values for local testing. Ensure the `message` property is a simple string or a function returning a string, and that `standardHeaders` and `legacyHeaders` are handled correctly (or removed if causing type issues).
    *   **Helmet (`helmetConfig`)**: Review the Helmet configuration. If `crossOriginEmbedderPolicy` or other properties cause type errors, consider removing them for local development or updating `@types/helmet`.
    *   **`requestId`**: Ensure this middleware correctly generates and attaches request IDs. Verify that `req.headers['x-request-id']` is always treated as a string (e.g., by using `toString()` or a nullish coalescing operator).

## 5. Overall Integration & Testing Strategy

This section outlines how the frontend and backend integrate and provides a strategy for local testing.

### 5.1 Data Flow

Understanding the data flow is crucial for debugging and verifying functionality.

1.  **Microsoft Graph API:** This is the authoritative source for all M365 tenant data (users, groups, licenses, audit logs, etc.).
2.  **Backend (`src/services/graphService.ts`):**
    *   Receives requests from the frontend (e.g., `/api/users`).
    *   Initializes a `GraphService` instance using the `accessToken` provided by the frontend.
    *   Makes authenticated calls to the Microsoft Graph API using the `@microsoft/microsoft-graph-client` library.
    *   Processes the Graph API response (e.g., extracts `value` array for collections).
    *   Returns the data to the frontend.
3.  **Backend Route Handlers (`src/routes/*.ts`):**
    *   Receive HTTP requests from the frontend.
    *   Call the appropriate `GraphService` method.
    *   Perform any necessary server-side validation or data transformation.
    *   Construct a standardized `ApiResponse` object.
    *   Send the `ApiResponse` back to the frontend.
4.  **Frontend (Redux Toolkit Query - `src/store/api/*.ts`):**
    *   Redux Toolkit Query (RTK Query) hooks in React components trigger API calls.
    *   `fetchBaseQuery` (configured in `apiSlice.ts`) handles sending requests to the backend and attaching the JWT token.
    *   RTK Query manages caching, loading states, and error handling for the frontend components.
5.  **Frontend Components (`src/components/**/*.tsx`, `src/pages/**/*.tsx`):**
    *   Consume data from RTK Query hooks.
    *   Render the fetched data (e.g., `UserList` displays users, `LicenseUsageChart` displays license data).
    *   Handle user interactions (e.g., form submissions for creating/updating entities), which trigger mutations via RTK Query, sending data back to the backend.

### 5.2 Authentication Flow

The authentication flow is critical for securing access to M365 data and involves both frontend and backend components.

1.  **Frontend (MSAL.js - `src/hooks/useAuth.ts`, `src/components/auth/LoginForm.tsx`, `src/components/auth/OAuthCallback.tsx`):**
    *   The user initiates a login (e.g., clicks a "Login" button).
    *   The frontend application (using `@azure/msal-browser` and `@azure/msal-react`) redirects the user to the Microsoft identity platform for authentication.
    *   Upon successful authentication, Microsoft redirects the user back to the `redirectUri` (e.g., `http://localhost:3004/auth/callback`) with an authorization `code`.
    *   The frontend extracts this `code` and sends it to the backend's `/api/auth/callback` endpoint.
    *   The frontend also acquires an `accessToken` for the Microsoft Graph API (usually silently after the initial code exchange). This `accessToken` is then stored in the frontend's Redux store (`auth.token`).
2.  **Backend (`src/routes/auth.ts`, `src/services/authService.ts`):**
    *   The `/api/auth/callback` endpoint receives the authorization `code` from the frontend.
    *   `AuthService` (using `@azure/msal-node`) exchanges this `code` for tokens (including an access token for Graph API) with the Microsoft identity platform.
    *   The backend then generates its own JWT (JSON Web Token) for session management, containing basic user information (ID, display name, roles). This JWT is signed with `config.jwt.secret`.
    *   This backend-generated JWT is sent back to the frontend.
3.  **Frontend (Redux Store):**
    *   The frontend receives the backend-generated JWT and stores it in the Redux store (`auth.token`). This JWT is used for authenticating requests to the backend.
4.  **Backend Middleware (`src/middleware/auth.ts`):**
    *   **`authenticate` middleware:** Verifies the backend-generated JWT sent by the frontend in the `Authorization` header. If valid, it decodes the JWT and attaches the `AuthUser` object to `req.user`.
    *   **`graphAuth` middleware:** This is crucial. It extracts the *Microsoft Graph API access token* (which the frontend acquired and sent in the `Authorization` header alongside the backend-generated JWT) and attaches it to `req.graphAccessToken`. This token is then used by `GraphService` to make calls to the actual Microsoft Graph API.
5.  **Graph API Calls:**
    *   When the frontend makes a request to a backend endpoint that requires Graph API access (e.g., `/api/users`), the `authenticate` and `graphAuth` middleware ensure that `req.user` and `req.graphAccessToken` are populated.
    *   The route handler then initializes `GraphService` with `req.graphAccessToken`, allowing it to make authenticated calls to the Microsoft Graph API.

### 5.3 Local Testing Steps

To get the application fully functional locally with live Graph API data, follow these steps:

1.  **Azure AD Application Setup:**
    *   Ensure you have an Azure AD application registered in your test tenant.
    *   Note down the **Application (client) ID** and **Directory (tenant) ID**.
    *   Configure **Redirect URIs**: Add `http://localhost:3004` (or your chosen local frontend port) as a "Single-page application (SPA)" redirect URI.
    *   Configure **API Permissions**: Grant necessary **delegated** Microsoft Graph API permissions (e.g., `User.Read.All`, `Group.Read.All`, `Directory.Read.All`, `License.Read.All`, `User.ReadWrite.All`, `Group.ReadWrite.All`). **Grant admin consent** for these permissions.

2.  **Environment Variable Configuration (`.env` files):**
    *   **Project Root (`.env` for frontend):**
        *   Create a `.env` file in the project root (if not present, copy from `.env.example`).
        *   Populate with frontend-specific variables:

            ```env
            VITE_APP_TITLE="M365 Tenant Admin Tool"
            VITE_API_BASE_URL="http://localhost:3004/api" # Points to your local backend
            VITE_AZURE_CLIENT_ID="YOUR_FRONTEND_AZURE_CLIENT_ID"
            VITE_AZURE_TENANT_ID="YOUR_AZURE_TENANT_ID"
            VITE_AZURE_REDIRECT_URI="http://localhost:3004" # Must match Azure AD app registration
            VITE_DEBUG_MODE="true"
            VITE_AZURE_SCOPES="User.Read User.Read.All Group.Read.All Directory.Read.All" # Add more as needed
            ```

    *   **Backend (`.env` for backend):**
        *   Create a separate `.env` file in the project root for backend variables (or ensure the existing `.env` contains these).
        *   Populate with backend-specific variables:

            ```env
            PORT=3004
            NODE_ENV=development
            AZURE_CLIENT_ID="YOUR_BACKEND_AZURE_CLIENT_ID" # Often same as frontend, but can be different for OBO flow
            AZURE_CLIENT_SECRET="YOUR_BACKEND_AZURE_CLIENT_SECRET" # Required for confidential client app
            AZURE_TENANT_ID="YOUR_AZURE_TENANT_ID"
            AZURE_REDIRECT_URI="http://localhost:3004/auth/callback" # Backend callback URL
            JWT_SECRET="YOUR_STRONG_JWT_SECRET" # Generate a strong random string
            SESSION_SECRET="YOUR_STRONG_SESSION_SECRET" # Generate a strong random string
            GRAPH_API_ENDPOINT="https://graph.microsoft.com/v1.0"
            GRAPH_SCOPES="User.Read User.Read.All Group.Read.All Directory.Read.All" # Match frontend scopes
            LOG_LEVEL=info
            LOG_FILE=logs/app.log
            RATE_LIMIT_WINDOW_MS=900000
            RATE_LIMIT_MAX_REQUESTS=100
            CORS_ORIGIN="http://localhost:3004" # Your frontend's URL
            ```

        *   **Note:** For local testing, `AZURE_CLIENT_ID` might be the same for frontend and backend if the backend is just proxying. `AZURE_CLIENT_SECRET` is crucial for the backend's confidential client application.

3.  **Install Dependencies:**
    *   Open your terminal in the project root.
    *   Run `npm install` to install all frontend and backend dependencies.

4.  **Start the Backend Server:**
    *   In your terminal, run the newly created script:

        ```bash
        npm run start:backend-dev
        ```

    *   Monitor the terminal for any errors. You should see messages indicating the server has started successfully.

5.  **Start the Frontend Development Server:**
    *   Open a **new** terminal window in the project root.
    *   Run:

        ```bash
        npm run dev
        ```

    *   This will typically open your browser to `http://localhost:3004`.

6.  **Test the Application:**
    *   **Login:** Attempt to log in using an Azure AD account that has permissions in your test tenant.
    *   **Feature Verification:**
        *   Navigate through the **Users**, **Groups**, and **Licenses** sections. Verify that real data from your tenant is displayed.
        *   Test **create, update, and delete operations** for users and groups (if implemented and you have the necessary permissions).
        *   Confirm **adding/removing members and owners** for groups.
        *   Check the **Dashboard** and **Reports** sections for live data.
    *   **Error Handling:** Intentionally trigger some errors (e.g., try to create a user with invalid data) to see if the application handles them gracefully.

7.  **Monitor & Debug:**
    *   **Browser Developer Tools (Network Tab):** Inspect network requests.
        *   Frontend requests should go to `http://localhost:3004/api/...`.
        *   Verify that the `Authorization` header contains the JWT token.
        *   Observe responses from your backend.
    *   **Backend Terminal:** Monitor the terminal where `npm run start:backend-dev` is running for server-side logs and errors.
    *   **Browser Console:** Check for any frontend errors.
