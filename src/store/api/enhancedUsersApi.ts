import { apiSlice } from './apiSlice';
import { M365User, BulkImportUser, BulkImportProgress } from '../../types';
import { getDataService } from '../../services/dataService';
import { CSVParser } from '../../services/csvParser';

/**
 * Enhanced Users API endpoints with real Microsoft Graph API implementation
 */
export const enhancedUsersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Create single user using Graph API
    createUser: builder.mutation<M365User, Partial<M365User>>({
      queryFn: async (userData) => {
        try {
          if (!userData.userPrincipalName || !userData.displayName || !userData.password) {
            return { 
              error: { 
                status: 400, 
                data: { message: 'DisplayName, UserPrincipalName, and Password are required' } 
              } 
            };
          }

          const dataService = getDataService();
          
          // Check username availability first
          const availability = await dataService.checkUsernameAvailability(userData.userPrincipalName);
          if (!availability.available) {
            return { 
              error: { 
                status: 409, 
                data: { 
                  message: 'Username already exists in tenant',
                  suggestions: availability.suggestions
                } 
              } 
            };
          }

          // Create user via Graph API
          const newUser = await dataService.createUser({
            displayName: userData.displayName,
            userPrincipalName: userData.userPrincipalName,
            password: userData.password,
            jobTitle: userData.jobTitle,
            department: userData.department,
            officeLocation: userData.office,
          });

          // Transform Graph API response to M365User format
          const m365User: M365User = {
            id: newUser.id || '',
            displayName: newUser.displayName || '',
            userPrincipalName: newUser.userPrincipalName || '',
            firstName: userData.firstName || newUser.givenName || '',
            lastName: userData.lastName || newUser.surname || '',
            email: newUser.mail || newUser.userPrincipalName || '',
            department: newUser.department,
            jobTitle: newUser.jobTitle,
            office: newUser.officeLocation,
            manager: userData.manager,
            licenseType: userData.licenseType,
            groups: userData.groups || [],
            password: userData.password,
            forcePasswordChange: userData.forcePasswordChange ?? true,
            status: newUser.accountEnabled ? 'Active' : 'Disabled',
            createdDateTime: newUser.createdDateTime || new Date().toISOString()
          };
          
          return { data: m365User };
        } catch (error: any) {
          console.error('User creation failed:', error);
          return { 
            error: { 
              status: 500, 
              data: { message: error.message || 'Failed to create user' } 
            } 
          };
        }
      },
      invalidatesTags: ['User', 'Dashboard'],
    }),

    // Upload and parse CSV file for bulk import
    uploadBulkImportFile: builder.mutation<{ users: BulkImportUser[]; summary: any }, FormData>({
      queryFn: async (formData) => {
        try {
          const file = formData.get('file') as File;
          if (!file) {
            return { 
              error: { 
                status: 400, 
                data: { message: 'No file provided' } 
              } 
            };
          }

          if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            return { 
              error: { 
                status: 400, 
                data: { message: 'File must be a CSV file' } 
              } 
            };
          }

          // Read CSV content
          const csvContent = await file.text();
          console.log('📋 Processing CSV file:', file.name, `(${file.size} bytes)`);

          // Parse CSV with validation
          const parser = new CSVParser({
            requiredFields: ['displayName', 'userPrincipalName'],
            validateEmails: true,
            checkDuplicates: true
          });

          const parseResult = parser.parseCSV(csvContent);
          
          // Check for critical parsing errors
          if (parseResult.summary.valid === 0 && parseResult.summary.total > 0) {
            return { 
              error: { 
                status: 400, 
                data: { 
                  message: 'No valid users found in CSV file',
                  details: parseResult.summary.errors
                } 
              } 
            };
          }

          return { 
            data: { 
              users: parseResult.users,
              summary: parseResult.summary
            } 
          };
        } catch (error: any) {
          console.error('CSV upload failed:', error);
          return { 
            error: { 
              status: 500, 
              data: { message: error.message || 'Failed to process CSV file' } 
            } 
          };
        }
      },
    }),

    // Process bulk import with real Graph API calls
    processBulkImport: builder.mutation<BulkImportProgress, { users: BulkImportUser[]; dryRun?: boolean }>({
      queryFn: async ({ users, dryRun = false }) => {
        try {
          const validUsers = users.filter(u => u.status === 'Valid' || u.status === 'Pending');
          
          if (validUsers.length === 0) {
            return { 
              error: { 
                status: 400, 
                data: { message: 'No valid users to process' } 
              } 
            };
          }

          if (dryRun) {
            // Dry run - just validate without creating
            console.log(`🔍 Dry run: Would create ${validUsers.length} users`);
            
            const progress: BulkImportProgress = {
              total: validUsers.length,
              processed: validUsers.length,
              successful: validUsers.length,
              failed: 0,
              percentage: 100,
              errors: []
            };
            
            return { data: progress };
          }

          console.log(`🚀 Starting bulk user creation: ${validUsers.length} users`);
          
          let processed = 0;
          let successful = 0;
          let failed = 0;
          const errors: any[] = [];

          const dataService = getDataService();
          
          // Transform to format expected by Graph API
          const graphUsers = validUsers.map(user => ({
            displayName: user.displayName,
            userPrincipalName: user.userPrincipalName,
            password: user.password,
            firstName: user.firstName,
            lastName: user.lastName,
            jobTitle: user.jobTitle,
            department: user.department,
            office: user.office,
            manager: user.manager,
            usageLocation: user.usageLocation || 'US',
            licenseType: user.licenseType
          }));

          // Call bulk creation method with detailed progress tracking
          const result = await dataService.createUsersBulk(graphUsers, (progress) => {
            processed = progress.processed;
            successful = progress.successful;
            failed = progress.failed;
            errors.splice(0, errors.length, ...progress.errors);
            
            console.log(`📈 Progress Update: ${progress.processed}/${validUsers.length} processed (${progress.successful} ✅, ${progress.failed} ❌)`);
          });

          const finalProgress: BulkImportProgress = {
            total: validUsers.length,
            processed: validUsers.length,
            successful: result.successful.length,
            failed: result.failed.length,
            percentage: 100,
            errors: result.failed.map(f => ({
              rowNumber: validUsers.findIndex(u => u.userPrincipalName === f.user.userPrincipalName) + 1,
              userPrincipalName: f.user.userPrincipalName,
              error: f.error,
              details: []
            }))
          };
          
          console.log(`✅ Bulk import completed: ${finalProgress.successful} successful, ${finalProgress.failed} failed`);
          
          return { data: finalProgress };
        } catch (error: any) {
          console.error('Bulk import failed:', error);
          return { 
            error: { 
              status: 500, 
              data: { message: error.message || 'Bulk import failed' } 
            } 
          };
        }
      },
      invalidatesTags: ['User', 'Dashboard'],
    }),

    // Generate secure password (utility function)
    generatePassword: builder.query<{ password: string; strength: string }, { length?: number }>({
      queryFn: ({ length = 16 }) => {
        // Password generation utility function
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        
        // Ensure password complexity requirements
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*';
        
        // Force at least one character from each category
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += symbols[Math.floor(Math.random() * symbols.length)];
        
        // Fill remaining length
        for (let i = 4; i < length; i++) {
          password += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        
        // Shuffle the password
        password = password.split('').sort(() => Math.random() - 0.5).join('');
        
        return { 
          data: { 
            password, 
            strength: 'Strong' 
          } 
        };
      },
    }),

    // Validate username availability using Graph API
    validateUsername: builder.query<{ available: boolean; suggestions?: string[] }, string>({
      queryFn: async (username) => {
        try {
          const dataService = getDataService();
          const result = await dataService.checkUsernameAvailability(username);
          return { data: result };
        } catch (error: any) {
          console.error('Username validation failed:', error);
          return { 
            error: { 
              status: 500, 
              data: { message: error.message || 'Username validation failed' } 
            } 
          };
        }
      },
    }),

    // Get available managers from Graph API
    getAvailableManagers: builder.query<M365User[], void>({
      queryFn: async () => {
        try {
          const dataService = getDataService();
          
          // Get all users and filter for potential managers (with job titles suggesting management)
          const users = await dataService.getUsers(['id', 'displayName', 'userPrincipalName', 'jobTitle', 'department']);
          
          const managers = users
            .filter(user => 
              user.jobTitle && (
                user.jobTitle.toLowerCase().includes('manager') ||
                user.jobTitle.toLowerCase().includes('director') ||
                user.jobTitle.toLowerCase().includes('lead') ||
                user.jobTitle.toLowerCase().includes('supervisor')
              )
            )
            .map(user => ({
              id: user.id || '',
              displayName: user.displayName || '',
              userPrincipalName: user.userPrincipalName || '',
              firstName: user.givenName || '',
              lastName: user.surname || '',
              email: user.mail || user.userPrincipalName || '',
              department: user.department,
              jobTitle: user.jobTitle,
              status: user.accountEnabled ? 'Active' : 'Disabled'
            } as M365User));

          return { data: managers };
        } catch (error: any) {
          console.error('Failed to get managers:', error);
          return { 
            error: { 
              status: 500, 
              data: { message: error.message || 'Failed to get available managers' } 
            } 
          };
        }
      },
      providesTags: ['User'],
    }),

    // Update user using Graph API
    updateUser: builder.mutation<M365User, { id: string; updates: Partial<M365User> }>({
      queryFn: async ({ id, updates }) => {
        try {
          const dataService = getDataService();
          
          // Transform M365User updates to Graph API format
          const graphUpdates: any = {};
          if (updates.displayName) graphUpdates.displayName = updates.displayName;
          if (updates.firstName) graphUpdates.givenName = updates.firstName;
          if (updates.lastName) graphUpdates.surname = updates.lastName;
          if (updates.jobTitle) graphUpdates.jobTitle = updates.jobTitle;
          if (updates.department) graphUpdates.department = updates.department;
          if (updates.office) graphUpdates.officeLocation = updates.office;
          if (updates.status) graphUpdates.accountEnabled = updates.status === 'Active';

          await dataService.updateUser(id, graphUpdates);
          
          // Return updated user data
          const updatedUser: M365User = {
            id,
            displayName: updates.displayName || 'Updated User',
            userPrincipalName: updates.userPrincipalName || 'updated@company.com',
            firstName: updates.firstName || 'Updated',
            lastName: updates.lastName || 'User',
            email: updates.userPrincipalName || 'updated@company.com',
            department: updates.department,
            jobTitle: updates.jobTitle,
            office: updates.office,
            manager: updates.manager,
            licenseType: updates.licenseType,
            groups: updates.groups || [],
            status: updates.status || 'Active'
          };

          return { data: updatedUser };
        } catch (error: any) {
          console.error('User update failed:', error);
          return { 
            error: { 
              status: 500, 
              data: { message: error.message || 'Failed to update user' } 
            } 
          };
        }
      },
      invalidatesTags: ['User', 'Dashboard'],
    }),

    // Delete user using Graph API
    deleteUser: builder.mutation<{ success: boolean }, string>({
      queryFn: async (userId) => {
        try {
          const dataService = getDataService();
          await dataService.deleteUser(userId);
          return { data: { success: true } };
        } catch (error: any) {
          console.error('User deletion failed:', error);
          return { 
            error: { 
              status: 500, 
              data: { message: error.message || 'Failed to delete user' } 
            } 
          };
        }
      },
      invalidatesTags: ['User', 'Dashboard'],
    }),

    // Generate CSV template
    generateCSVTemplate: builder.query<{ template: string }, void>({
      queryFn: () => {
        const template = CSVParser.generateTemplate();
        return { data: { template } };
      },
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
  useGenerateCSVTemplateQuery,
} = enhancedUsersApi;