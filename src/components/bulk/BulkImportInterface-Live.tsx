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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  List,
  ListItem,
  ListItemText,
  Grid,
  CircularProgress
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
  Schedule
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import {
  useUploadBulkImportFileMutation,
  useProcessBulkImportMutation,
  useGenerateCSVTemplateQuery
} from '../../store/api/enhancedUsersApi';
import { BulkImportUser, BulkImportProgress } from '../../types';

interface ImportStats {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateEmails: number;
  missingRequired: number;
}

const BulkImportInterfaceLive: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedUsers, setParsedUsers] = useState<BulkImportUser[]>([]);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [importProgress, setImportProgress] = useState<BulkImportProgress | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);

  // RTK Query hooks
  const [uploadBulkImportFile, { isLoading: isUploading }] = useUploadBulkImportFileMutation();
  const [processBulkImport, { isLoading: isImporting }] = useProcessBulkImportMutation();
  const { data: csvTemplate } = useGenerateCSVTemplateQuery();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    console.log('📁 File dropped:', file.name, file.size, 'bytes');
    setCsvFile(file);
    setProcessingError(null);

    try {
      // Upload and parse CSV using RTK Query
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('📤 Uploading CSV file for parsing...');
      const result = await uploadBulkImportFile(formData).unwrap();
      
      console.log('📊 CSV parse result:', result);
      setParsedUsers(result.users);
      setImportStats({
        totalRows: result.summary.total,
        validRows: result.summary.valid,
        invalidRows: result.summary.invalid,
        duplicateEmails: result.summary.duplicates,
        missingRequired: result.summary.errors.filter(e => e.error.includes('Required')).length
      });
      
      setActiveStep(1);
      console.log('✅ CSV parsing completed successfully');
    } catch (error: any) {
      console.error('❌ CSV parsing failed:', error);
      setProcessingError(error.data?.message || 'Failed to parse CSV file');
    }
  }, [uploadBulkImportFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    maxFiles: 1
  });

  const startBulkImport = async () => {
    if (!parsedUsers.length) return;
    
    const validUsers = parsedUsers.filter(u => u.status === 'Valid' || u.status === 'Pending');
    if (validUsers.length === 0) {
      setProcessingError('No valid users to import');
      return;
    }

    console.log('🚀 Starting bulk user import with', validUsers.length, 'users');
    setIsProcessing(true);
    setProcessingError(null);
    setActiveStep(2);

    try {
      // Process bulk import using RTK Query
      const result = await processBulkImport({ users: validUsers }).unwrap();
      
      console.log('📊 Bulk import completed:', result);
      setImportProgress(result);
      setActiveStep(3);
      
      // Update parsed users with final status
      setParsedUsers(prev => prev.map(user => {
        const error = result.errors?.find(e => e.userPrincipalName === user.userPrincipalName);
        if (error) {
          return { ...user, status: 'Invalid', errorMessage: error.error };
        }
        if (validUsers.some(v => v.userPrincipalName === user.userPrincipalName)) {
          return { ...user, status: 'Valid' };
        }
        return user;
      }));
      
      console.log('✅ Bulk import process completed');
    } catch (error: any) {
      console.error('❌ Bulk import failed:', error);
      setProcessingError(error.data?.message || 'Bulk import failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    if (!csvTemplate?.template) return;
    
    const blob = new Blob([csvTemplate.template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bulk-user-import-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const reset = () => {
    setActiveStep(0);
    setCsvFile(null);
    setParsedUsers([]);
    setImportStats(null);
    setImportProgress(null);
    setIsProcessing(false);
    setProcessingError(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Valid':
      case 'Pending':
        return 'success';
      case 'Invalid':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Valid':
      case 'Pending':
        return <CheckCircle color="success" />;
      case 'Invalid':
        return <Error color="error" />;
      default:
        return <Warning color="warning" />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Bulk User Import
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Import multiple users from a CSV file directly to Microsoft 365 via Graph API.
      </Typography>

      {/* Error Alert */}
      {processingError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="subtitle2">Import Error</Typography>
          {processingError}
        </Alert>
      )}

      {/* Stepper */}
      <Stepper activeStep={activeStep} orientation="vertical" sx={{ mb: 4 }}>
        <Step>
          <StepLabel>Upload CSV File</StepLabel>
          <StepContent>
            <Typography variant="body2" paragraph>
              Upload a CSV file containing user information. Make sure it includes required columns.
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Button 
                startIcon={<Description />} 
                onClick={downloadTemplate}
                variant="outlined"
                size="small"
                sx={{ mr: 2 }}
              >
                Download Template
              </Button>
            </Box>

            {/* File Drop Zone */}
            <Paper
              {...getRootProps()}
              sx={{
                p: 4,
                border: '2px dashed',
                borderColor: isDragActive ? 'primary.main' : 'grey.300',
                bgcolor: isDragActive ? 'action.hover' : 'background.paper',
                cursor: 'pointer',
                textAlign: 'center',
                mb: 2
              }}
            >
              <input {...getInputProps()} />
              <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {isDragActive ? 'Drop your CSV file here' : 'Drag & drop CSV file here'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Or click to select file (CSV format only)
              </Typography>
              {csvFile && (
                <Typography variant="subtitle2" color="primary" sx={{ mt: 1 }}>
                  Selected: {csvFile.name} ({Math.round(csvFile.size / 1024)} KB)
                </Typography>
              )}
            </Paper>

            {isUploading && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Parsing CSV file...
                </Typography>
              </Box>
            )}
          </StepContent>
        </Step>

        <Step>
          <StepLabel>Review Users</StepLabel>
          <StepContent>
            {importStats && (
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={2.4}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <Typography color="text.secondary" variant="h6">
                        {importStats.totalRows}
                      </Typography>
                      <Typography variant="body2">Total Rows</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <Typography color="success.main" variant="h6">
                        {importStats.validRows}
                      </Typography>
                      <Typography variant="body2">Valid</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <Typography color="error.main" variant="h6">
                        {importStats.invalidRows}
                      </Typography>
                      <Typography variant="body2">Invalid</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <Typography color="warning.main" variant="h6">
                        {importStats.duplicateEmails}
                      </Typography>
                      <Typography variant="body2">Duplicates</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <Typography color="error.main" variant="h6">
                        {importStats.missingRequired}
                      </Typography>
                      <Typography variant="body2">Missing Required</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
              <Button 
                startIcon={<Preview />} 
                onClick={() => setShowPreview(true)}
                variant="outlined"
              >
                Preview Users
              </Button>
              <Button 
                startIcon={<PlayArrow />} 
                onClick={startBulkImport}
                variant="contained"
                disabled={isProcessing || !importStats || importStats.validRows === 0}
              >
                Start Import ({importStats?.validRows || 0} users)
              </Button>
            </Box>
          </StepContent>
        </Step>

        <Step>
          <StepLabel>Import Progress</StepLabel>
          <StepContent>
            {isProcessing && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Creating users in Microsoft 365...
                </Typography>
                <LinearProgress />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  This may take several minutes depending on the number of users.
                </Typography>
              </Box>
            )}
          </StepContent>
        </Step>

        <Step>
          <StepLabel>Import Complete</StepLabel>
          <StepContent>
            {importProgress && (
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <Typography color="text.secondary" variant="h6">
                        {importProgress.total}
                      </Typography>
                      <Typography variant="body2">Total Processed</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <Typography color="success.main" variant="h6">
                        {importProgress.successful}
                      </Typography>
                      <Typography variant="body2">Successful</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <Typography color="error.main" variant="h6">
                        {importProgress.failed}
                      </Typography>
                      <Typography variant="body2">Failed</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <Typography color="primary.main" variant="h6">
                        {importProgress.percentage}%
                      </Typography>
                      <Typography variant="body2">Complete</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            {importProgress && importProgress.errors && importProgress.errors.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="subtitle2">Import Errors:</Typography>
                <List dense>
                  {importProgress.errors.slice(0, 5).map((error, index) => (
                    <ListItem key={index} sx={{ py: 0 }}>
                      <ListItemText 
                        primary={`Row ${error.rowNumber}: ${error.userPrincipalName}`}
                        secondary={error.error}
                      />
                    </ListItem>
                  ))}
                  {importProgress.errors.length > 5 && (
                    <ListItem sx={{ py: 0 }}>
                      <ListItemText 
                        primary={`... and ${importProgress.errors.length - 5} more errors`}
                      />
                    </ListItem>
                  )}
                </List>
              </Alert>
            )}

            <Button startIcon={<Refresh />} onClick={reset} variant="outlined">
              Import Another File
            </Button>
          </StepContent>
        </Step>
      </Stepper>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onClose={() => setShowPreview(false)} maxWidth="lg" fullWidth>
        <DialogTitle>User Preview</DialogTitle>
        <DialogContent>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Row</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Display Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Job Title</TableCell>
                  <TableCell>Error</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {parsedUsers.slice(0, 50).map((user, index) => (
                  <TableRow key={index}>
                    <TableCell>{user.rowNumber}</TableCell>
                    <TableCell>
                      <Chip 
                        icon={getStatusIcon(user.status)} 
                        label={user.status} 
                        color={getStatusColor(user.status) as any}
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>{user.displayName}</TableCell>
                    <TableCell>{user.userPrincipalName}</TableCell>
                    <TableCell>{user.department}</TableCell>
                    <TableCell>{user.jobTitle}</TableCell>
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
            {parsedUsers.length > 50 && (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Showing first 50 of {parsedUsers.length} users
                </Typography>
              </Box>
            )}
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreview(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BulkImportInterfaceLive;