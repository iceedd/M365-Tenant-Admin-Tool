// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// User Types
export interface User {
  id: string;
  userPrincipalName: string;
  displayName: string;
  givenName: string;
  surname: string;
  jobTitle?: string;
  department?: string;
  officeLocation?: string;
  mail?: string;
  mobilePhone?: string;
  businessPhones: string[];
  accountEnabled: boolean;
  usageLocation?: string;
  assignedLicenses: AssignedLicense[];
  groups: string[];
  createdDateTime: string;
  lastSignInDateTime?: string;
}

export interface CreateUserRequest {
  userPrincipalName: string;
  displayName: string;
  givenName: string;
  surname: string;
  password: string;
  jobTitle?: string;
  department?: string;
  officeLocation?: string;
  mobilePhone?: string;
  usageLocation?: string;
  accountEnabled: boolean;
  assignLicenses?: string[];
  assignGroups?: string[];
}

export interface UpdateUserRequest {
  displayName?: string;
  givenName?: string;
  surname?: string;
  jobTitle?: string;
  department?: string;
  officeLocation?: string;
  mobilePhone?: string;
  usageLocation?: string;
  accountEnabled?: boolean;
}

// License Types
export interface License {
  skuId: string;
  skuPartNumber: string;
  servicePlans: ServicePlan[];
  prepaidUnits: PrepaidUnits;
  consumedUnits: number;
  appliesTo: string;
}

export interface ServicePlan {
  servicePlanId: string;
  servicePlanName: string;
  provisioningStatus: string;
  appliesTo: string;
}

export interface PrepaidUnits {
  enabled: number;
  suspended: number;
  warning: number;
}

export interface AssignedLicense {
  disabledPlans: string[];
  skuId: string;
}

// Group Types
export interface Group {
  id: string;
  displayName: string;
  description?: string;
  groupTypes: string[];
  mail?: string;
  mailEnabled: boolean;
  mailNickname: string;
  securityEnabled: boolean;
  createdDateTime: string;
  memberCount: number;
  ownerCount: number;
}

export interface CreateGroupRequest {
  displayName: string;
  description?: string;
  groupTypes: string[];
  mailEnabled: boolean;
  mailNickname: string;
  securityEnabled: boolean;
  owners?: string[];
  members?: string[];
}

// Dashboard Types
export interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalGroups: number;
  totalLicenses: number;
  availableLicenses: number;
  usedLicenses: number;
  recentActivities: Activity[];
  usersByDepartment: DepartmentStat[];
  licenseUsage: LicenseUsageStat[];
}

export interface Activity {
  id: string;
  type: 'user_created' | 'user_updated' | 'user_deleted' | 'group_created' | 'license_assigned';
  description: string;
  timestamp: string;
  userId?: string;
  userName?: string;
}

export interface DepartmentStat {
  department: string;
  userCount: number;
}

export interface LicenseUsageStat {
  licenseName: string;
  used: number;
  available: number;
  total: number;
}

// Auth Types
export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
  expiresIn: number;
}

// Form Types
export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'select' | 'multiselect' | 'checkbox' | 'tel';
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  helperText?: string;
  validation?: any;
}

// Table Types
export interface TableColumn {
  field: string;
  headerName: string;
  width?: number;
  flex?: number;
  sortable?: boolean;
  filterable?: boolean;
  renderCell?: (params: any) => React.ReactNode;
}

export interface TableProps {
  columns: TableColumn[];
  rows: any[];
  loading?: boolean;
  onRowClick?: (row: any) => void;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  pageSize?: number;
  checkboxSelection?: boolean;
  onSelectionChange?: (selection: string[]) => void;
}

// Theme Types
export interface ThemeMode {
  mode: 'light' | 'dark';
}

// Navigation Types
export interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  children?: NavItem[];
}

// Search and Filter Types
export interface SearchFilters {
  search?: string;
  department?: string;
  accountEnabled?: boolean;
  hasLicense?: boolean;
  groupId?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Notification Types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Bulk Operations
export interface BulkOperation {
  type: 'assign_license' | 'remove_license' | 'add_to_group' | 'remove_from_group' | 'enable_account' | 'disable_account';
  userIds: string[];
  payload?: any;
}

export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: Array<{ userId: string; error: string }>;
}