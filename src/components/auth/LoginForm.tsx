import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  Divider,
  Link,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Microsoft,
  Login as LoginIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../hooks/useAuth';
import { useInitiateOAuthMutation } from '../../store/api/authApi';
import { LoginRequest } from '../../types';

const schema = yup.object({
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email'),
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

interface LoginFormProps {
  onSuccess?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error } = useAuth();
  const [initiateOAuth, { isLoading: oauthLoading }] = useInitiateOAuthMutation();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginRequest) => {
    const result = await login(data);
    if (result.success && onSuccess) {
      onSuccess();
    }
  };

  const handleOAuthLogin = async () => {
    try {
      const result = await initiateOAuth().unwrap();
      window.location.href = result.authUrl;
    } catch (error) {
      console.error('OAuth initiation failed:', error);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
        padding: 3,
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ padding: 4 }}>
          <Box sx={{ textAlign: 'center', marginBottom: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              M365 User Provisioning
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to manage Microsoft 365 users
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ marginBottom: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Email"
                  type="email"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  margin="normal"
                  variant="outlined"
                  autoComplete="email"
                  autoFocus
                />
              )}
            />

            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  margin="normal"
                  variant="outlined"
                  autoComplete="current-password"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleTogglePasswordVisibility}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isSubmitting || loading}
              startIcon={
                isSubmitting || loading ? <CircularProgress size={20} /> : <LoginIcon />
              }
              sx={{ marginTop: 3, marginBottom: 2 }}
            >
              {isSubmitting || loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </Box>

          <Divider sx={{ margin: '20px 0' }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>

          <Button
            fullWidth
            variant="outlined"
            size="large"
            onClick={handleOAuthLogin}
            disabled={oauthLoading}
            startIcon={
              oauthLoading ? <CircularProgress size={20} /> : <Microsoft />
            }
            sx={{ marginBottom: 2 }}
          >
            {oauthLoading ? 'Redirecting...' : 'Sign in with Microsoft'}
          </Button>

          <Box sx={{ textAlign: 'center', marginTop: 2 }}>
            <Link href="#" variant="body2" color="primary">
              Forgot password?
            </Link>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginForm;