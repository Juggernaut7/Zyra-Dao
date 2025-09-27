import { Router } from 'express';
import {
  authenticate,
  getProfile,
  updateProfile,
  verifySignature
} from '../controllers/authController.ts';
import {
  verifyWalletSignature,
  verifyToken,
  optionalAuth
} from '../middleware/auth.ts';
import {
  validateUserRegistration
} from '../middleware/validation.ts';
import { authLimiter } from '../middleware/rateLimiting.ts';

const router = Router();

// Public routes
router.post('/verify-signature', authLimiter, verifySignature);
router.post('/authenticate', authLimiter, validateUserRegistration, verifyWalletSignature, authenticate);

// Protected routes
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);

export default router;
