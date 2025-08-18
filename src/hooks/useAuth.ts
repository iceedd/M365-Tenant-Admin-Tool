import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { loginStart, loginSuccess, loginFailure, logout } from '../store/slices/authSlice';
import { useLoginMutation, useGetCurrentUserQuery } from '../store/api/authApi';
import { LoginRequest } from '../types';

export const useAuth = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);
  
  const [loginMutation] = useLoginMutation();
  const { data: currentUser, error: userError } = useGetCurrentUserQuery(undefined, {
    skip: !auth.token,
  });

  useEffect(() => {
    if (userError && 'status' in userError && userError.status === 401) {
      dispatch(logout());
    }
  }, [userError, dispatch]);

  const login = async (credentials: LoginRequest) => {
    try {
      dispatch(loginStart());
      const result = await loginMutation(credentials).unwrap();
      dispatch(loginSuccess({
        user: result.user,
        token: result.token,
      }));
      return { success: true };
    } catch (error: any) {
      const errorMessage = error?.data?.message || 'Login failed';
      dispatch(loginFailure(errorMessage));
      return { success: false, error: errorMessage };
    }
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  return {
    ...auth,
    login,
    logout: handleLogout,
    currentUser,
  };
};