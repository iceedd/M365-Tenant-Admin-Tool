# M365 Tenant Admin Tool - Testing Instructions

## Setting Up For Testing

The application has been configured and is ready for testing. We've made the following changes:

1. Created dedicated `tsconfig.backend.json` for backend compilation
2. Updated backend code to use proper relative imports
3. Added `start:backend-dev` script to package.json
4. Fixed the GraphAPI integration by removing mock data
5. Set up proper environment variables in `.env` file

## Before You Run the Application

1. **Update `.env` File:** Before testing, please update the `.env` file with your actual Azure AD application details:
   ```
   AZURE_CLIENT_ID=your-application-client-id
   AZURE_TENANT_ID=your-tenant-id
   VITE_AZURE_CLIENT_ID=your-application-client-id
   VITE_AZURE_TENANT_ID=your-tenant-id
   ```
   
   Note: The `AZURE_CLIENT_SECRET` should be retrieved securely from Microsoft Service Authentication (MSA) and not stored directly in the .env file. Your application should be configured to retrieve this secret from MSA at runtime.

2. **Install All Dependencies:** Make sure all dependencies are installed:
   ```bash
   npm install
   ```

## Running the Application

### Backend

Run the backend server on port 3004:

```bash
npm run start:backend-dev
```

If you encounter any TypeScript errors, you can use the following alternative command which is more permissive:

```bash
npx ts-node --transpile-only -P tsconfig.backend.json src/server.ts
```

### Frontend

In a separate terminal, run the frontend:

```bash
npm run dev
```

## Testing the Application

1. Open your browser to the URL shown in the frontend terminal (typically http://localhost:3000)
2. Log in using your Microsoft 365 credentials
3. After successful authentication, you should be able to:
   - View users from your tenant
   - View groups from your tenant
   - View licenses from your tenant
   - Perform CRUD operations if you have the appropriate permissions

## Troubleshooting

If you encounter issues:

1. **Backend Fails to Start:**
   - Check the console for specific error messages
   - Ensure all required environment variables are set
   - Try the `--transpile-only` flag to bypass TypeScript errors

2. **Authentication Issues:**
   - Verify the Azure AD application has the correct permissions
   - Check the redirect URI matches the one configured in Azure AD
   - Look for CORS errors in the browser console

3. **API Endpoint Issues:**
   - Use a tool like Postman to test API endpoints directly
   - Check the network tab in browser dev tools to see the requests and responses

## Next Steps

After successful testing, you might want to:

1. Deploy the application to a production environment
2. Implement additional features like bulk operations
3. Add more robust error handling and logging
4. Implement caching for better performance