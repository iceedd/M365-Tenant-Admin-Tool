import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import groupRoutes from './groups';
import licenseRoutes from './licenses';
import reportRoutes from './reports';
import settingsRoutes from './settings';
import testDataRoutes from './test-data';
import secureDataRoutes from './secure-data';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'M365 User Provisioning Tool API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/groups', groupRoutes);
router.use('/licenses', licenseRoutes);
router.use('/reports', reportRoutes);
router.use('/settings', settingsRoutes);

// Test data routes (no auth required for testing)
router.use('/test-data', testDataRoutes);

// Secure data routes (user authentication-based - PRODUCTION READY)
router.use('/secure-data', secureDataRoutes);

export default router;