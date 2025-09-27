import { Router } from 'express';
import {
  createProposal,
  getProposals,
  getProposal,
  updateProposalStatus,
  getAIProposalSummary,
  getUserProposals,
  deleteProposal
} from '../controllers/proposalController.ts';
import {
  verifyToken,
  optionalAuth,
  requireAdmin
} from '../middleware/auth.ts';
import {
  validateProposalCreation,
  validatePagination,
  validateProposalTiming
} from '../middleware/validation.ts';
import { proposalLimiter, aiLimiter } from '../middleware/rateLimiting.js';

const router = Router();

// Public routes
router.get('/', optionalAuth, validatePagination, getProposals);
router.get('/:id', optionalAuth, getProposal);

// Protected routes
router.post('/', verifyToken, proposalLimiter, validateProposalCreation, validateProposalTiming, createProposal);
router.get('/user/my-proposals', verifyToken, validatePagination, getUserProposals);
router.delete('/:id', verifyToken, deleteProposal);

// AI routes
router.get('/:id/ai-summary', aiLimiter, getAIProposalSummary);

// Admin routes
router.put('/:id/status', verifyToken, requireAdmin, updateProposalStatus);

export default router;
