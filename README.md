# M365 Tenant Admin Tool

A comprehensive web application for Microsoft 365 tenant administration, built with React and TypeScript. This tool provides a modern, user-friendly interface for IT administrators to manage users, groups, licenses, and tenant settings.

![React](https://img.shields.io/badge/React-18+-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)
![Material-UI](https://img.shields.io/badge/Material--UI-5+-purple.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🚀 Features

### Core Functionality
- **User Management** - Create and manage M365 users with comprehensive validation
- **Bulk Import** - CSV-based bulk user creation with progress tracking  
- **Group Management** - Create and manage Distribution, Security, and Microsoft 365 groups
- **License Management** - Assign and manage M365 licenses across your tenant
- **Tenant Discovery** - View tenant information and subscription details

### Administrative Features
- **Activity Logging** - Complete audit trail with search and export capabilities
- **Reports & Analytics** - Comprehensive reporting on users, licenses, groups, and security
- **Settings Management** - Configure user preferences, tenant settings, and admin users
- **Admin Role Management** - Support for 50+ Azure AD administrative roles

### User Experience
- **Professional UI** - Built with Material-UI for enterprise-grade interface
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- **Real-time Notifications** - Live updates and feedback for all operations
- **Export Capabilities** - Export data to CSV, PDF, and Excel formats

## 🛠️ Technology Stack

- **Frontend:** React 18+ with TypeScript
- **UI Library:** Material-UI (MUI) 5+
- **State Management:** Redux Toolkit
- **Form Handling:** Formik with Yup validation
- **Routing:** React Router 6
- **Build Tool:** Vite

## 📦 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/m365-tenant-admin-tool.git
   cd m365-tenant-admin-tool
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 📋 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript checks
```

## 🏗️ Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── activity/        # Activity logging components
│   ├── groups/          # Group management components
│   ├── layout/          # Layout and navigation
│   ├── licenses/        # License management components
│   ├── reports/         # Reports and analytics
│   ├── settings/        # Settings and configuration
│   └── users/           # User management components
├── pages/               # Page-level components
├── store/               # Redux store and slices
├── utils/               # Utility functions
└── App.tsx             # Main application component
```

## ✨ Feature Highlights

### 1. Dashboard
- Real-time metrics and system health indicators
- Quick action buttons for common administrative tasks
- Visual overview of tenant status

### 2. User Management
- Comprehensive user creation with validation
- Required fields: Email, Password, License
- Optional fields: Department, Office Location
- Real-time form validation and error handling

### 3. Group Management  
- 4-step group creation wizard
- Support for Distribution, Security, and Microsoft 365 groups
- Member management and permissions
- Advanced group analytics

### 4. License Management
- Complete M365 license overview
- Assign and unassign licenses to users
- License utilization analytics and cost tracking
- Bulk license operations

### 5. Bulk Import
- Drag-and-drop CSV file upload
- Comprehensive file validation and preview
- Multi-step import workflow with progress tracking
- Detailed results summary and error handling

### 6. Activity Logging
- Complete audit trail of all administrative actions
- Advanced search and filtering capabilities
- Export functionality for compliance requirements
- Real-time activity monitoring

### 7. Reports & Analytics
- License analytics and cost analysis
- User activity reports by department
- Group membership insights
- Security and compliance reporting
- Time range filtering and data export

### 8. Settings & Configuration
- User preferences (theme, language, timezone)
- Tenant configuration and security settings
- Administrator user management
- Support for 50+ Azure AD administrative roles

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
VITE_APP_TITLE=M365 Tenant Admin Tool
VITE_API_BASE_URL=https://your-api-endpoint.com
VITE_TENANT_ID=your-tenant-id
VITE_CLIENT_ID=your-client-id
```

### Microsoft Graph API Integration
This application is designed to work with Microsoft Graph API. To connect to a live Azure AD tenant:

1. Register an Azure AD application
2. Configure appropriate API permissions
3. Update authentication configuration
4. Replace mock data with real API calls

## 🚦 Development Status

- ✅ **Core Features** - All 9 modules fully implemented
- ✅ **UI/UX** - Professional Material-UI interface  
- ✅ **Form Validation** - Comprehensive validation system
- ✅ **State Management** - Redux Toolkit implementation
- ✅ **Export Features** - CSV, PDF, Excel capabilities
- ✅ **Responsive Design** - Mobile and desktop optimized
- 🔄 **API Integration** - Ready for Microsoft Graph connection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check the [Issues](https://github.com/yourusername/m365-tenant-admin-tool/issues) page
2. Create a new issue with detailed information
3. Provide steps to reproduce any bugs

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Deployment Options
- **Azure Static Web Apps** - Recommended for Azure AD integration
- **Netlify** - Easy deployment with Git integration
- **Vercel** - Optimized for React applications

---

**Built with ❤️ for IT Administrators managing Microsoft 365 environments**
