import { Router } from 'express';
import {
  getTreasuryBalance,
  getTreasuryTransactions,
  createTreasuryTransaction,
  updateTreasuryTransaction,
  getAITreasuryInsights,
  getTreasuryAnalytics,
  getNetworkInfo
} from '../controllers/treasuryController.ts';
import {
  verifyToken,
  requireAdmin
} from '../middleware/auth.ts';
import {
  validateTreasuryTransaction,
  validatePagination
} from '../middleware/validation.ts';
import { aiLimiter } from '../middleware/rateLimiting.ts';

const router = Router();

// Public routes
router.get('/balance', getTreasuryBalance);
router.get('/transactions', validatePagination, getTreasuryTransactions);
router.get('/network-info', getNetworkInfo);

// AI routes
router.get('/ai-insights', aiLimiter, getAITreasuryInsights);

// Analytics routes
router.get('/analytics', getTreasuryAnalytics);

// Admin routes (relaxed for demo)
router.post('/transactions', verifyToken, validateTreasuryTransaction, createTreasuryTransaction);
router.put('/transactions/:id', verifyToken, requireAdmin, updateTreasuryTransaction);

export default router;
