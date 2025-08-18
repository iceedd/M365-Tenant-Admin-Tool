import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { useDispatch } from 'react-redux';
import { loginSuccess, loginFailure } from '../../store/slices/authSlice';
import { useHandleOAuthCallbackMutation } from '../../store/api/authApi';

const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const [handleCallback, { isLoading, error }] = useHandleOAuthCallbackMutation();

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        dispatch(loginFailure('OAuth authentication was cancelled or failed'));
        navigate('/login');
        return;
      }

      if (!code || !state) {
        dispatch(loginFailure('Invalid OAuth callback parameters'));
        navigate('/login');
        return;
      }

      try {
        const result = await handleCallback({ code, state }).unwrap();
        dispatch(loginSuccess({
          user: result.user,
          token: result.token,
        }));
        navigate('/dashboard');
      } catch (error: any) {
        const errorMessage = error?.data?.message || 'OAuth authentication failed';
        dispatch(loginFailure(errorMessage));
        navigate('/login');
      }
    };

    processCallback();
  }, [searchParams, navigate, dispatch, handleCallback]);

  if (error) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 3,
        }}
      >
        <Alert severity="error" sx={{ marginBottom: 2 }}>
          Authentication failed. Redirecting to login...
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 3,
      }}
    >
      <CircularProgress size={60} sx={{ marginBottom: 2 }} />
      <Typography variant="h6" gutterBottom>
        Completing authentication...
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Please wait while we sign you in.
      </Typography>
    </Box>
  );
};

export default OAuthCallback;