# Azure AD Setup Guide for M365 Tenant Admin Tool

## 🎯 Prerequisites
- Azure AD tenant with admin privileges
- Global Administrator or Application Administrator role

## 📝 Step 1: App Registration

### Create Application Registration:
1. Navigate to [Azure Portal](https://portal.azure.com)
2. Go to **Azure Active Directory** → **App registrations**
3. Click **New registration**
4. Configure:
   - **Name:** `M365 Tenant Admin Tool`
   - **Supported account types:** `Accounts in this organizational directory only (Single tenant)`
   - **Redirect URI (optional):** 
     - Platform: `Single-page application (SPA)`
     - URI: `http://localhost:3000`

### After Registration:
- **Copy Application (client) ID** - You'll need this
- **Copy Directory (tenant) ID** - You'll need this

## 🔐 Step 2: Configure API Permissions

Navigate to **API permissions** and add these Microsoft Graph permissions:

### Application Permissions (App-only):
```
Application.Read.All                 - Read applications
AuditLog.Read.All                   - Read audit logs  
Directory.Read.All                  - Read directory data
Directory.ReadWrite.All             - Read and write directory data
Group.Read.All                      - Read all groups
Group.ReadWrite.All                 - Read and write all groups
Organization.Read.All               - Read organization info
Reports.Read.All                    - Read usage reports
RoleManagement.Read.Directory       - Read role assignments
User.Read.All                       - Read all users
User.ReadWrite.All                  - Read and write all users
```

### Delegated Permissions (User context):
```
Directory.Read.All                  - Read directory data
Directory.ReadWrite.All             - Read and write directory data  
Group.Read.All                      - Read all groups
Group.ReadWrite.All                 - Read and write all groups
User.Read                          - Read user profile
User.Read.All                      - Read all users
User.ReadWrite.All                 - Read and write all users
```

### Grant Admin Consent:
1. Click **Grant admin consent for [Your Tenant]**
2. Confirm the consent for all permissions

## ⚙️ Step 3: Authentication Configuration

### Redirect URIs:
Add these redirect URIs in **Authentication** section:
- `http://localhost:3000` (Development)
- `https://your-production-domain.com` (Production)

### Implicit grant and hybrid flows:
- ✅ **Access tokens** (used for implicit flows)
- ✅ **ID tokens** (used for implicit and hybrid flows)

### Advanced settings:
- **Allow public client flows:** `No`
- **Supported account types:** `Single tenant`

## 🔑 Step 4: Certificates & Secrets (Optional)

For enhanced security, you can create a client secret:
1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Description: `M365 Admin Tool Secret`
4. Expires: `24 months` (recommended)
5. **Copy the secret value immediately** - it won't be shown again

## 📋 Step 5: Required Information

After completing the setup, you'll need these values for your application:

```env
VITE_AZURE_CLIENT_ID=your-application-client-id
VITE_AZURE_TENANT_ID=your-directory-tenant-id
VITE_AZURE_REDIRECT_URI=http://localhost:3000
VITE_AZURE_SCOPES=https://graph.microsoft.com/User.Read,https://graph.microsoft.com/Directory.Read.All
```

## 🚨 Security Best Practices

### Development:
- Use `http://localhost:3000` for local development
- Store secrets in `.env.local` (never commit to git)
- Use least-privilege principle for permissions

### Production:
- Use HTTPS redirect URIs only
- Implement certificate-based authentication
- Enable conditional access policies
- Monitor application usage through Azure AD logs

## 🔍 Troubleshooting

### Common Issues:
1. **Permission denied:** Ensure admin consent is granted
2. **Redirect URI mismatch:** Check exact URI matches in Azure and code
3. **Token validation failed:** Verify tenant ID and client ID
4. **CORS issues:** Ensure proper SPA configuration in Azure

### Useful Azure AD Endpoints:
- **Authority:** `https://login.microsoftonline.com/{tenant-id}`
- **Graph API:** `https://graph.microsoft.com/v1.0/`
- **Token endpoint:** `https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/token`

## 📚 Additional Resources

- [Microsoft Graph API Documentation](https://docs.microsoft.com/en-us/graph/)
- [MSAL.js Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-js-initializing-client-applications)
- [Azure AD App Registration Guide](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)

---
**Next Steps:** Once Azure setup is complete, we'll integrate MSAL and Microsoft Graph SDK into the application.