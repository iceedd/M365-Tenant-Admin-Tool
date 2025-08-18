import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Grid
} from '@mui/material';
import {
  CloudUpload,
  Download,
  Preview,
  PlayArrow,
  CheckCircle,
  Error,
  Warning,
  Refresh,
  FileDownload,
  Description,
  People,
  Schedule
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';

// Types based on PowerShell CSV import structure
interface BulkUser {
  rowNumber: number;
  displayName: string;
  userPrincipalName: string;
  firstName: string;
  lastName: string;
  department: string;
  jobTitle: string;
  office: string;
  manager: string;
  licenseType: string;
  groups: string;
  password: string;
  forcePasswordChange: boolean;
  status: 'pending' | 'processing' | 'success' | 'error';
  errorMessage?: string;
}

interface ImportProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  percentage: number;
  currentUser?: string;
  isComplete: boolean;
}

interface ImportStats {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateEmails: number;
  missingRequired: number;
}

// Sample CSV data matching PowerShell tool template
const sampleCsvData = `DisplayName,UserPrincipalName,FirstName,LastName,Department,JobTitle,Office,Manager,LicenseType,Groups,Password,ForcePasswordChange
John Smith,john.smith@contoso.com,John,Smith,IT,Developer,United Kingdom - London,manager@contoso.com,SPE_E3,"IT Team,Developers",,true
Jane Doe,jane.doe@contoso.com,Jane,Doe,HR,Manager,United Kingdom - Manchester,director@contoso.com,SPE_E5,"HR Team,Managers",,true
Mike Wilson,mike.wilson@contoso.com,Mike,Wilson,Sales,Representative,United States - New York,sales.manager@contoso.com,SPB,"Sales Team,All Employees",,true`;

const BulkImportInterface: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedUsers, setParsedUsers] = useState<BulkUser[]>([]);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // File drop zone configuration
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      parseCsvFile(file);
      setActiveStep(1);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false
  });

  // Parse CSV file (simulating PowerShell Import-Csv)
  const parseCsvFile = async (file: File) => {
    const text = await file.text();
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const users: BulkUser[] = [];
    let validRows = 0;
    let invalidRows = 0;
    let duplicateEmails = 0;
    let missingRequired = 0;
    const emailSet = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const rowData: any = {};
      
      headers.forEach((header, index) => {
        rowData[header] = values[index] || '';
      });

      // Validation (like PowerShell validation)
      let isValid = true;
      let errorMessage = '';

      // Check required fields
      if (!rowData.UserPrincipalName || !rowData.DisplayName) {
        isValid = false;
        errorMessage = 'Missing required fields (UserPrincipalName, DisplayName)';
        missingRequired++;
      }

      // Check for duplicate emails
      if (emailSet.has(rowData.UserPrincipalName)) {
        isValid = false;
        errorMessage = 'Duplicate email address';
        duplicateEmails++;
      } else {
        emailSet.add(rowData.UserPrincipalName);
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (rowData.UserPrincipalName && !emailRegex.test(rowData.UserPrincipalName)) {
        isValid = false;
        errorMessage = 'Invalid email format';
      }

      const user: BulkUser = {
        rowNumber: i,
        displayName: rowData.DisplayName || '',
        userPrincipalName: rowData.UserPrincipalName || '',
        firstName: rowData.FirstName || '',
        lastName: rowData.LastName || '',
        department: rowData.Department || '',
        jobTitle: rowData.JobTitle || '',
        office: rowData.Office || '',
        manager: rowData.Manager || '',
        licenseType: rowData.LicenseType || '',
        groups: rowData.Groups || '',
        password: rowData.Password || '',
        forcePasswordChange: rowData.ForcePasswordChange === 'true',
        status: isValid ? 'pending' : 'error',
        errorMessage: isValid ? undefined : errorMessage
      };

      users.push(user);
      if (isValid) validRows++; else invalidRows++;
    }

    setParsedUsers(users);
    setImportStats({
      totalRows: users.length,
      validRows,
      invalidRows,
      duplicateEmails,
      missingRequired
    });
  };

  // Download CSV template (like PowerShell tool template)
  const downloadTemplate = () => {
    const blob = new Blob([sampleCsvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'M365_BulkImport_Template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Process bulk import (like PowerShell bulk processing)
  const processBulkImport = async () => {
    if (!parsedUsers.length) return;

    setIsProcessing(true);
    setActiveStep(2);

    const validUsers = parsedUsers.filter(user => user.status === 'pending');
    let processed = 0;
    let successful = 0;
    let failed = 0;

    for (const user of validUsers) {
      // Update user status to processing
      setParsedUsers(prev => prev.map(u => 
        u.rowNumber === user.rowNumber ? { ...u, status: 'processing' } : u
      ));

      // Update progress
      setImportProgress({
        total: validUsers.length,
        processed: processed + 1,
        successful,
        failed,
        percentage: Math.round(((processed + 1) / validUsers.length) * 100),
        currentUser: user.displayName,
        isComplete: false
      });

      // Simulate user creation (like PowerShell New-M365User)
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

      // Simulate some failures (like real-world scenarios)
      const isSuccess = Math.random() > 0.15; // 85% success rate

      if (isSuccess) {
        successful++;
        setParsedUsers(prev => prev.map(u => 
          u.rowNumber === user.rowNumber ? { ...u, status: 'success' } : u
        ));
      } else {
        failed++;
        setParsedUsers(prev => prev.map(u => 
          u.rowNumber === user.rowNumber ? { 
            ...u, 
            status: 'error', 
            errorMessage: 'License assignment failed - insufficient licenses available'
          } : u
        ));
      }

      processed++;
    }

    // Final progress update
    setImportProgress(prev => prev ? {
      ...prev,
      processed,
      successful,
      failed,
      percentage: 100,
      isComplete: true,
      currentUser: undefined
    } : null);

    setIsProcessing(false);
    setActiveStep(3);
  };

  const resetImport = () => {
    setActiveStep(0);
    setCsvFile(null);
    setParsedUsers([]);
    setImportStats(null);
    setImportProgress(null);
    setIsProcessing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle color="success" fontSize="small" />;
      case 'error': return <Error color="error" fontSize="small" />;
      case 'processing': return <Schedule color="primary" fontSize="small" />;
      default: return <Schedule color="disabled" fontSize="small" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'processing': return 'primary';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
        Bulk CSV Import
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Import multiple M365 users from a CSV file with validation, preview, and progress tracking.
      </Typography>

      {/* Step-by-step process */}
      <Stepper activeStep={activeStep} orientation="vertical" sx={{ mb: 3 }}>
        <Step>
          <StepLabel>Upload CSV File</StepLabel>
          <StepContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Box
                      {...getRootProps()}
                      sx={{
                        border: '2px dashed',
                        borderColor: isDragActive ? 'primary.main' : 'grey.300',
                        borderRadius: 2,
                        p: 4,
                        textAlign: 'center',
                        cursor: 'pointer',
                        backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <input {...getInputProps()} />
                      <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        {isDragActive ? 'Drop the CSV file here' : 'Drag & drop CSV file here'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        or click to browse files
                      </Typography>
                      <Button variant="outlined" component="span">
                        Choose File
                      </Button>
                    </Box>
                    {csvFile && (
                      <Alert severity="success" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                          File uploaded: {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)
                        </Typography>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <Description sx={{ mr: 1 }} />
                      CSV Template
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Download the CSV template with the correct format and sample data.
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<FileDownload />}
                      onClick={downloadTemplate}
                      fullWidth
                    >
                      Download Template
                    </Button>
                    
                    <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                      Required Fields:
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="DisplayName" secondary="Full name of user" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="UserPrincipalName" secondary="Email/username" />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </StepContent>
        </Step>

        <Step>
          <StepLabel>Review & Validate</StepLabel>
          <StepContent>
            {importStats && (
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
                        {importStats.totalRows}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Total Rows</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                        {importStats.validRows}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Valid</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="error.main" sx={{ fontWeight: 'bold' }}>
                        {importStats.invalidRows}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Invalid</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                        {importStats.duplicateEmails}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Duplicates</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button
                variant="outlined"
                startIcon={<Preview />}
                onClick={() => setShowPreview(true)}
                disabled={!parsedUsers.length}
              >
                Preview Data
              </Button>
              <Button
                variant="contained"
                startIcon={<PlayArrow />}
                onClick={processBulkImport}
                disabled={!importStats?.validRows || isProcessing}
              >
                Start Import ({importStats?.validRows} users)
              </Button>
            </Box>
          </StepContent>
        </Step>

        <Step>
          <StepLabel>Processing</StepLabel>
          <StepContent>
            {importProgress && (
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Import Progress
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {importProgress.processed}/{importProgress.total} ({importProgress.percentage}%)
                    </Typography>
                  </Box>
                  
                  <LinearProgress 
                    variant="determinate" 
                    value={importProgress.percentage} 
                    sx={{ height: 8, borderRadius: 4, mb: 2 }}
                  />
                  
                  {importProgress.currentUser && (
                    <Typography variant="body2" color="text.secondary">
                      Currently processing: {importProgress.currentUser}
                    </Typography>
                  )}

                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h5" color="success.main" sx={{ fontWeight: 'bold' }}>
                          {importProgress.successful}
                        </Typography>
                        <Typography variant="caption">Successful</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h5" color="error.main" sx={{ fontWeight: 'bold' }}>
                          {importProgress.failed}
                        </Typography>
                        <Typography variant="caption">Failed</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h5" color="primary.main" sx={{ fontWeight: 'bold' }}>
                          {importProgress.total - importProgress.processed}
                        </Typography>
                        <Typography variant="caption">Remaining</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}
          </StepContent>
        </Step>

        <Step>
          <StepLabel>Complete</StepLabel>
          <StepContent>
            {importProgress && (
              <Alert severity={importProgress.failed > 0 ? "warning" : "success"} sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Import completed! {importProgress.successful} users created successfully
                  {importProgress.failed > 0 && `, ${importProgress.failed} failed`}.
                </Typography>
              </Alert>
            )}
            <Button variant="contained" startIcon={<Refresh />} onClick={resetImport}>
              Start New Import
            </Button>
          </StepContent>
        </Step>
      </Stepper>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onClose={() => setShowPreview(false)} maxWidth="xl" fullWidth>
        <DialogTitle>
          CSV Data Preview ({parsedUsers.length} rows)
        </DialogTitle>
        <DialogContent>
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Status</TableCell>
                  <TableCell>Display Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Job Title</TableCell>
                  <TableCell>License</TableCell>
                  <TableCell>Error</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {parsedUsers.map((user) => (
                  <TableRow key={user.rowNumber}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getStatusIcon(user.status)}
                        <Chip 
                          label={user.status} 
                          size="small" 
                          color={getStatusColor(user.status) as any}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>{user.displayName}</TableCell>
                    <TableCell>{user.userPrincipalName}</TableCell>
                    <TableCell>{user.department}</TableCell>
                    <TableCell>{user.jobTitle}</TableCell>
                    <TableCell>{user.licenseType}</TableCell>
                    <TableCell>
                      {user.errorMessage && (
                        <Typography variant="caption" color="error">
                          {user.errorMessage}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreview(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BulkImportInterface;