# 🚀 Quick Start Guide - Azure AD Integration

This guide will help you connect your M365 Tenant Admin Tool to your real Microsoft 365 tenant.

## ⚡ Quick Setup (5 minutes)

### Step 1: Create Azure AD App Registration

1. Go to [Azure Portal](https://portal.azure.com) → **Azure Active Directory**
2. Navigate to **App registrations** → **New registration**
3. Fill in:
   - **Name:** `M365 Tenant Admin Tool`
   - **Account types:** `Accounts in this organizational directory only`
   - **Redirect URI:** `Single-page application (SPA)` → `http://localhost:3000`
4. Click **Register**

### Step 2: Configure API Permissions

1. In your new app, go to **API permissions**
2. Click **Add a permission** → **Microsoft Graph** → **Delegated permissions**
3. Add these permissions:
   ```
   ✅ User.Read
   ✅ User.ReadWrite.All  
   ✅ Group.ReadWrite.All
   ✅ Directory.ReadWrite.All
   ```
4. Click **Grant admin consent for [Your Tenant]**

### Step 3: Set Up Environment

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and fill in your values:
   ```env
   VITE_AZURE_CLIENT_ID=your-application-client-id
   VITE_AZURE_TENANT_ID=your-directory-tenant-id  
   VITE_AZURE_REDIRECT_URI=http://localhost:3000
   VITE_AZURE_SCOPES=User.Read Directory.ReadWrite.All User.ReadWrite.All Group.ReadWrite.All
   ```

3. **Where to find these values:**
   - **Client ID:** App registration → Overview → Application (client) ID
   - **Tenant ID:** App registration → Overview → Directory (tenant) ID

### Step 4: Start the Application

```bash
npm run dev
```

Visit `http://localhost:3000` - you should see the Microsoft login screen!

## 🎯 What Happens Next

1. **First Time:** You'll see the Microsoft login screen
2. **Authentication:** Sign in with your M365 account
3. **Permissions:** Grant the requested permissions 
4. **Success:** You'll see the dashboard with real M365 data!

## 🔧 Features Now Available

With Azure AD connected, you'll have access to:

- ✅ **Real User Management** - Create, modify, delete M365 users
- ✅ **Live Group Management** - Manage distribution and security groups  
- ✅ **License Assignment** - Assign/remove M365 licenses
- ✅ **Tenant Information** - Real subscription and tenant data
- ✅ **Audit Logs** - Live activity from your M365 tenant
- ✅ **Reports** - Real usage analytics and insights

## 🛠️ Development vs Production

### Development Mode (localhost)
- Uses `http://localhost:3000` redirect URI
- Enables debug logging
- Shows detailed error messages

### Production Deployment
1. Update redirect URI to your production domain
2. Set `VITE_ENVIRONMENT=production` 
3. Use HTTPS redirect URIs only
4. Disable debug mode

## ❌ Troubleshooting

### "Configuration Error"
- Check your `.env.local` file exists and has correct values
- Verify Client ID and Tenant ID are correct

### "Login Failed"  
- Ensure redirect URI matches exactly (`http://localhost:3000`)
- Check if admin consent was granted for API permissions

### "Graph API Error"
- Verify your account has proper admin permissions
- Check if the required API permissions were added and consented

### "CORS Error"
- Ensure you're using `http://localhost:3000` (not a different port)
- Verify the app registration is set to "Single-page application"

## 📚 Need More Help?

- **Detailed Setup:** See `AZURE_SETUP.md` for comprehensive instructions
- **API Reference:** Check Microsoft Graph documentation
- **Permissions:** Review the required permissions list

## 🔒 Security Notes

- **Never commit `.env.local`** - it contains sensitive information
- **Use least privilege** - only grant necessary permissions  
- **Production security** - implement proper security measures for production

---

**🎉 Once configured, your M365 Tenant Admin Tool will be a fully functional Microsoft 365 administration interface!**