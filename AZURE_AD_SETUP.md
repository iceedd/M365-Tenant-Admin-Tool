# Azure AD Application Setup for M365 Tenant Admin Tool

## Current Issue
You're getting an error because your Azure AD application is configured as multi-tenant, but the user account you're trying to sign in with doesn't have access to your specific tenant.

## Solution Options

### Option 1: Update Azure AD App Registration (Recommended)

1. Go to the [Azure Portal](https://portal.azure.com)
2. Navigate to **Microsoft Entra ID** > **App Registrations** 
3. Find and select your application (ID: 8918bebc-cdeb-452f-8fe5-5dc019341c05)
4. In the **Authentication** section:
   - Verify the redirect URI is set to `http://localhost:3000`
   - Under **Supported account types**, change to **"Accounts in this organizational directory only (Single tenant)"**
5. Click **Save**

### Option 2: Add External User to Your Tenant

If you want to keep the multi-tenant setting and use an external account:
1. Go to the [Azure Portal](https://portal.azure.com)
2. Navigate to **Microsoft Entra ID** > **Users**
3. Click **+ New User** > **Invite External User**
4. Enter the email address of the external user
5. Configure appropriate access permissions
6. Send the invitation

### Option 3: Update Application to Use Your Tenant Specifically

If you want to modify the application to target your specific tenant explicitly:

1. Update your `.env` file:
   ```
   VITE_AZURE_AUTHORITY=https://login.microsoftonline.com/3c9ef3ea-bda5-4125-bc67-af60198385b3
   ```

2. Make sure the application uses this authority URL when configuring MSAL.

## API Permissions Needed

Make sure your application has these Graph API permissions:
- User.Read
- User.Read.All
- Group.Read.All
- Directory.Read.All

Don't forget to grant admin consent for these permissions!

## Redirect URIs

Ensure these redirect URIs are added to your Azure AD app registration:
- `http://localhost:3000`
- `http://localhost:3000/auth/callback`