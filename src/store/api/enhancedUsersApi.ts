import { apiSlice } from './apiSlice';
import { M365User, BulkImportUser, BulkImportProgress, ValidationError } from '../../types';

// Enhanced Users API based on PowerShell M365.UserManagement module
export const enhancedUsersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Create single user (from PowerShell New-M365User)
    createUser: builder.mutation<M365User, Partial<M365User>>({
      queryFn: async (userData) => {
        // Simulate user creation with validation like PowerShell version
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mock validation
        if (!userData.userPrincipalName || !userData.displayName) {
          return { 
            error: { 
              status: 400, 
              data: { message: 'UserPrincipalName and DisplayName are required' } 
            } 
          };
        }
        
        // Check username availability (like PowerShell real-time validation)
        if (userData.userPrincipalName === 'taken@contoso.com') {
          return { 
            error: { 
              status: 409, 
              data: { message: 'Username already exists in tenant' } 
            } 
          };
        }
        
        const newUser: M365User = {
          id: 'user-' + Date.now(),
          displayName: userData.displayName || '',
          userPrincipalName: userData.userPrincipalName || '',
          firstName: userData.firstName || userData.displayName?.split(' ')[0] || '',
          lastName: userData.lastName || userData.displayName?.split(' ').slice(1).join(' ') || '',
          email: userData.userPrincipalName || '',
          department: userData.department,
          jobTitle: userData.jobTitle,
          office: userData.office,
          manager: userData.manager,
          licenseType: userData.licenseType,
          groups: userData.groups || [],
          password: userData.password || 'TempPass123!',
          forcePasswordChange: userData.forcePasswordChange ?? true,
          status: 'Active',
          createdDateTime: new Date().toISOString()
        };
        
        return { data: newUser };
      },
      invalidatesTags: ['User', 'Dashboard'],
    }),

    // Bulk import users from CSV (from PowerShell Import-UsersFromCSV)
    uploadBulkImportFile: builder.mutation<{ users: BulkImportUser[]; summary: any }, FormData>({
      queryFn: async (formData) => {
        // Simulate CSV parsing like PowerShell Import-Csv
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock CSV parsing results
        const mockUsers: BulkImportUser[] = [
          {
            displayName: 'Sarah Connor',
            userPrincipalName: 'sarah.connor@contoso.com',
            firstName: 'Sarah',
            lastName: 'Connor',
            department: 'Security',
            jobTitle: 'Security Specialist',
            office: 'Los Angeles',
            manager: 'john.smith@contoso.com',
            licenseType: 'BusinessPremium',
            groups: 'Security Team,All Employees',
            password: '',
            forcePasswordChange: true,
            rowNumber: 1,
            status: 'Pending'
          },
          {
            displayName: 'Kyle Reese',
            userPrincipalName: 'kyle.reese@contoso.com',
            firstName: 'Kyle',
            lastName: 'Reese',
            department: 'Operations',
            jobTitle: 'Operations Manager',
            office: 'London',
            manager: 'jane.wilson@contoso.com',
            licenseType: 'SPE_E3',
            groups: 'Operations Team,Managers',
            password: '',
            forcePasswordChange: true,
            rowNumber: 2,
            status: 'Pending'
          }
        ];
        
        return { 
          data: { 
            users: mockUsers,
            summary: {
              total: mockUsers.length,
              valid: mockUsers.length,
              invalid: 0,
              duplicates: 0
            }
          } 
        };
      },
    }),

    // Process bulk import (with progress tracking like PowerShell)
    processBulkImport: builder.mutation<BulkImportProgress, { users: BulkImportUser[]; dryRun?: boolean }>({
      queryFn: async ({ users, dryRun = false }) => {
        // Simulate bulk processing with progress updates
        const total = users.length;
        let processed = 0;
        let successful = 0;
        let failed = 0;
        const errors: any[] = [];
        
        // Simulate processing each user
        for (const user of users) {
          await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing time
          
          processed++;
          
          // Simulate some failures (like PowerShell error handling)
          if (user.userPrincipalName.includes('invalid')) {
            failed++;
            errors.push({
              rowNumber: user.rowNumber,
              userPrincipalName: user.userPrincipalName,
              error: 'Invalid email format',
              details: 'Email address does not match tenant domain requirements'
            });
          } else {
            successful++;
          }
          
          // Could emit progress updates here in real implementation
        }
        
        const progress: BulkImportProgress = {
          total,
          processed,
          successful,
          failed,
          percentage: Math.round((processed / total) * 100),
          errors
        };
        
        return { data: progress };
      },
      invalidatesTags: ['User', 'Dashboard'],
    }),

    // Generate secure password (from PowerShell New-SecurePassword)
    generatePassword: builder.query<{ password: string; strength: string }, { length?: number }>({
      queryFn: ({ length = 16 }) => {
        // Generate secure password like PowerShell version
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        
        for (let i = 0; i < length; i++) {
          password += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        
        return { 
          data: { 
            password, 
            strength: 'Strong' 
          } 
        };
      },
    }),

    // Validate username availability (real-time like PowerShell)
    validateUsername: builder.query<{ available: boolean; suggestions?: string[] }, string>({
      queryFn: async (username) => {
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API call
        
        // Mock validation
        const unavailableUsernames = ['admin@contoso.com', 'test@contoso.com', 'john.smith@contoso.com'];
        const available = !unavailableUsernames.includes(username);
        
        let suggestions: string[] = [];
        if (!available) {
          const baseName = username.split('@')[0];
          const domain = username.split('@')[1];
          suggestions = [
            `${baseName}1@${domain}`,
            `${baseName}.new@${domain}`,
            `${baseName}2025@${domain}`
          ];
        }
        
        return { data: { available, suggestions } };
      },
    }),

    // Get available managers (for dropdown population)
    getAvailableManagers: builder.query<M365User[], void>({
      queryFn: () => {
        const managers: M365User[] = [
          {
            id: '1', displayName: 'John Smith', userPrincipalName: 'john.smith@contoso.com',
            firstName: 'John', lastName: 'Smith', email: 'john.smith@contoso.com',
            department: 'IT', jobTitle: 'IT Director', status: 'Active'
          },
          {
            id: '2', displayName: 'Jane Wilson', userPrincipalName: 'jane.wilson@contoso.com',
            firstName: 'Jane', lastName: 'Wilson', email: 'jane.wilson@contoso.com',
            department: 'HR', jobTitle: 'HR Director', status: 'Active'
          }
        ];
        
        return { data: managers };
      },
      providesTags: ['User'],
    }),

    // Update user (partial updates)
    updateUser: builder.mutation<M365User, { id: string; updates: Partial<M365User> }>({
      queryFn: async ({ id, updates }) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock user update
        const updatedUser: M365User = {
          id,
          displayName: updates.displayName || 'Updated User',
          userPrincipalName: updates.userPrincipalName || 'updated@contoso.com',
          firstName: updates.firstName || 'Updated',
          lastName: updates.lastName || 'User',
          email: updates.userPrincipalName || 'updated@contoso.com',
          department: updates.department,
          jobTitle: updates.jobTitle,
          office: updates.office,
          manager: updates.manager,
          licenseType: updates.licenseType,
          groups: updates.groups || [],
          status: updates.status || 'Active'
        };
        
        return { data: updatedUser };
      },
      invalidatesTags: ['User', 'Dashboard'],
    }),

    // Delete user
    deleteUser: builder.mutation<{ success: boolean }, string>({
      queryFn: async (userId) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { data: { success: true } };
      },
      invalidatesTags: ['User', 'Dashboard'],
    }),
  }),
});

export const {
  useCreateUserMutation,
  useUploadBulkImportFileMutation,
  useProcessBulkImportMutation,
  useGeneratePasswordQuery,
  useLazyValidateUsernameQuery,
  useGetAvailableManagersQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = enhancedUsersApi;