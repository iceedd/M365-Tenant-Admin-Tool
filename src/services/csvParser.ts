import { BulkImportUser } from '../types';

export interface CSVParseResult {
  users: BulkImportUser[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    duplicates: number;
    errors: Array<{
      row: number;
      field: string;
      value: string;
      error: string;
    }>;
  };
}

export interface CSVValidationOptions {
  requiredFields: string[];
  allowedFields: string[];
  validateEmails: boolean;
  checkDuplicates: boolean;
  defaultDomain?: string;
}

const DEFAULT_OPTIONS: CSVValidationOptions = {
  requiredFields: ['displayName', 'userPrincipalName'],
  allowedFields: [
    'displayName', 'userPrincipalName', 'firstName', 'lastName',
    'jobTitle', 'department', 'office', 'manager', 'licenseType',
    'groups', 'password', 'forcePasswordChange', 'usageLocation'
  ],
  validateEmails: true,
  checkDuplicates: true
};

export class CSVParser {
  private options: CSVValidationOptions;

  constructor(options: Partial<CSVValidationOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Parse CSV text content into structured user data
   */
  parseCSV(csvContent: string): CSVParseResult {
    const lines = csvContent.trim().split('\n');
    const errors: Array<{ row: number; field: string; value: string; error: string }> = [];
    const users: BulkImportUser[] = [];
    const userPrincipalNames = new Set<string>();
    
    if (lines.length === 0) {
      return {
        users: [],
        summary: {
          total: 0,
          valid: 0,
          invalid: 0,
          duplicates: 0,
          errors: [{ row: 0, field: 'file', value: '', error: 'CSV file is empty' }]
        }
      };
    }

    // Parse header row
    const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
    console.log('📋 CSV Headers:', headers);

    // Validate headers
    const missingRequired = this.options.requiredFields.filter(field => !headers.includes(field));
    if (missingRequired.length > 0) {
      errors.push({
        row: 1,
        field: 'headers',
        value: headers.join(','),
        error: `Missing required columns: ${missingRequired.join(', ')}`
      });
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const rowNumber = i + 1;
      const values = this.parseCSVRow(lines[i]);
      
      if (values.length !== headers.length) {
        errors.push({
          row: rowNumber,
          field: 'structure',
          value: lines[i],
          error: `Row has ${values.length} values but expected ${headers.length}`
        });
        continue;
      }

      // Create user object
      const user: BulkImportUser = {
        rowNumber,
        status: 'Pending',
        displayName: '',
        userPrincipalName: '',
        firstName: '',
        lastName: '',
        password: '',
        forcePasswordChange: true
      };

      let isValidRow = true;

      // Map CSV values to user object
      headers.forEach((header, index) => {
        const value = values[index]?.trim();
        
        switch (header.toLowerCase()) {
          case 'displayname':
          case 'display name':
          case 'name':
            user.displayName = value;
            break;
          case 'userprincipalname':
          case 'user principal name':
          case 'email':
          case 'username':
            user.userPrincipalName = value;
            break;
          case 'firstname':
          case 'first name':
          case 'givenname':
          case 'given name':
            user.firstName = value;
            break;
          case 'lastname':
          case 'last name':
          case 'surname':
            user.lastName = value;
            break;
          case 'jobtitle':
          case 'job title':
          case 'title':
            user.jobTitle = value;
            break;
          case 'department':
          case 'dept':
            user.department = value;
            break;
          case 'office':
          case 'location':
          case 'officelocation':
          case 'office location':
            user.office = value;
            break;
          case 'manager':
            user.manager = value;
            break;
          case 'licensetype':
          case 'license type':
          case 'license':
          case 'sku':
          case 'skupartnumber':
            user.licenseType = value ? value.toUpperCase() : undefined;
            break;
          case 'groups':
            user.groups = value;
            break;
          case 'password':
            user.password = value;
            break;
          case 'forcepasswordchange':
          case 'force password change':
          case 'mustchangepassword':
            user.forcePasswordChange = value.toLowerCase() === 'true' || value === '1';
            break;
          case 'usagelocation':
          case 'usage location':
          case 'country':
            user.usageLocation = value;
            break;
        }
      });

      // Validate required fields
      this.options.requiredFields.forEach(field => {
        const fieldValue = user[field as keyof BulkImportUser];
        if (!fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === '')) {
          errors.push({
            row: rowNumber,
            field,
            value: fieldValue as string,
            error: `Required field '${field}' is missing or empty`
          });
          isValidRow = false;
        }
      });

      // Validate email format
      if (this.options.validateEmails && user.userPrincipalName) {
        if (!this.isValidEmail(user.userPrincipalName)) {
          errors.push({
            row: rowNumber,
            field: 'userPrincipalName',
            value: user.userPrincipalName,
            error: 'Invalid email format'
          });
          isValidRow = false;
        }
      }

      // Validate display name format (no special characters that could cause issues)
      if (user.displayName) {
        if (user.displayName.length < 2) {
          errors.push({
            row: rowNumber,
            field: 'displayName',
            value: user.displayName,
            error: 'Display name must be at least 2 characters long'
          });
          isValidRow = false;
        }
        if (user.displayName.length > 64) {
          errors.push({
            row: rowNumber,
            field: 'displayName',
            value: user.displayName,
            error: 'Display name cannot exceed 64 characters'
          });
          isValidRow = false;
        }
        if (/[<>"]/.test(user.displayName)) {
          errors.push({
            row: rowNumber,
            field: 'displayName',
            value: user.displayName,
            error: 'Display name cannot contain < > or " characters'
          });
          isValidRow = false;
        }
      }

      // Validate password strength if provided
      if (user.password) {
        if (user.password.length < 8) {
          errors.push({
            row: rowNumber,
            field: 'password',
            value: '***',
            error: 'Password must be at least 8 characters long'
          });
          isValidRow = false;
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(user.password)) {
          errors.push({
            row: rowNumber,
            field: 'password',
            value: '***',
            error: 'Password must contain at least one uppercase, lowercase, and numeric character'
          });
          isValidRow = false;
        }
      }

      // Validate license type if provided
      if (user.licenseType) {
        const validLicenseTypes = [
          'SPE_E3', 'SPE_E5', 'SPB', 'DEVELOPERPACK_E5', 'ENTERPRISEPACK', 
          'ENTERPRISEPREMIUM', 'DESKLESSPACK', 'MIDSIZEPACK', 'LITEPACK',
          'OFFICESUBSCRIPTION', 'POWER_BI_PRO', 'TEAMS_EXPLORATORY'
        ];
        if (!validLicenseTypes.includes(user.licenseType.toUpperCase())) {
          errors.push({
            row: rowNumber,
            field: 'licenseType',
            value: user.licenseType,
            error: `Invalid license type. Valid options: ${validLicenseTypes.join(', ')}`
          });
          // Don't mark as invalid - just warn, license assignment will be skipped
        }
      }

      // Validate usage location if provided
      if (user.usageLocation) {
        if (!/^[A-Z]{2}$/.test(user.usageLocation)) {
          errors.push({
            row: rowNumber,
            field: 'usageLocation',
            value: user.usageLocation,
            error: 'Usage location must be a 2-letter country code (e.g., US, GB, CA)'
          });
          isValidRow = false;
        }
      }

      // Check for duplicates
      if (this.options.checkDuplicates && user.userPrincipalName) {
        if (userPrincipalNames.has(user.userPrincipalName.toLowerCase())) {
          errors.push({
            row: rowNumber,
            field: 'userPrincipalName',
            value: user.userPrincipalName,
            error: 'Duplicate email address in CSV'
          });
          isValidRow = false;
        } else {
          userPrincipalNames.add(user.userPrincipalName.toLowerCase());
        }
      }

      // Generate password if not provided
      if (!user.password) {
        user.password = this.generateSecurePassword();
      }

      // Set default values
      if (!user.firstName && user.displayName) {
        user.firstName = user.displayName.split(' ')[0];
      }
      if (!user.lastName && user.displayName) {
        const nameParts = user.displayName.split(' ');
        user.lastName = nameParts.slice(1).join(' ') || '';
      }

      user.status = isValidRow ? 'Valid' : 'Invalid';
      users.push(user);
    }

    const validUsers = users.filter(u => u.status === 'Valid');
    const invalidUsers = users.filter(u => u.status === 'Invalid');
    const duplicateCount = errors.filter(e => e.error.includes('Duplicate')).length;

    console.log(`📊 CSV Parse Result: ${validUsers.length} valid, ${invalidUsers.length} invalid, ${duplicateCount} duplicates`);

    return {
      users,
      summary: {
        total: users.length,
        valid: validUsers.length,
        invalid: invalidUsers.length,
        duplicates: duplicateCount,
        errors
      }
    };
  }

  /**
   * Parse a single CSV row handling quoted values and commas
   */
  private parseCSVRow(row: string): string[] {
    const values: string[] = [];
    let currentValue = '';
    let inQuotes = false;
    let i = 0;

    while (i < row.length) {
      const char = row[i];
      
      if (char === '"') {
        if (inQuotes && row[i + 1] === '"') {
          // Escaped quote
          currentValue += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        // End of value
        values.push(currentValue.trim());
        currentValue = '';
        i++;
      } else {
        currentValue += char;
        i++;
      }
    }

    // Add final value
    values.push(currentValue.trim());
    
    return values.map(v => v.replace(/^["']|["']$/g, ''));
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Generate a secure random password
   */
  private generateSecurePassword(length: number = 12): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';
    const allChars = uppercase + lowercase + numbers + symbols;
    
    let password = '';
    
    // Ensure at least one character from each category
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill remaining length
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Generate CSV template with headers
   */
  static generateTemplate(): string {
    const headers = [
      'displayName',
      'userPrincipalName',
      'firstName',
      'lastName',
      'jobTitle',
      'department',
      'office',
      'password',
      'forcePasswordChange',
      'usageLocation',
      'licenseType'
    ];
    
    const sampleData1 = [
      'John Doe',
      'john.doe@company.com',
      'John',
      'Doe',
      'Software Engineer',
      'IT',
      'New York',
      'TempPass123!',
      'true',
      'US',
      'DEVELOPERPACK_E5'
    ];

    const sampleData2 = [
      'Jane Smith',
      'jane.smith@company.com',
      'Jane', 
      'Smith',
      'Product Manager',
      'Marketing',
      'San Francisco',
      'SecurePass456!',
      'true',
      'US',
      'SPE_E5'
    ];

    const sampleData3 = [
      'Mike Wilson',
      'mike.wilson@company.com',
      'Mike',
      'Wilson', 
      'Sales Representative',
      'Sales',
      'Chicago',
      'StrongPass789!',
      'true',
      'US',
      'SPE_E3'
    ];
    
    return [
      headers.join(','),
      sampleData1.join(','),
      sampleData2.join(','),
      sampleData3.join(',')
    ].join('\n');
  }
}