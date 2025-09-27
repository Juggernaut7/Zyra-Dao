import { Router } from 'express';
import {
  getMembers,
  getMember,
  updateMemberProfile,
  getMemberStats,
  getLeaderboard,
  createOrUpdateMember,
  getDAOStats
} from '../controllers/memberController.ts';
import {
  verifyToken,
  requireAdmin
} from '../middleware/auth.ts';
import {
  validateMemberUpdate
} from '../middleware/validation.ts';

const router = Router();

// Public routes
router.get('/', getMembers);
router.get('/leaderboard', getLeaderboard);
router.get('/stats', getDAOStats);
router.get('/:walletAddress', getMember);
router.get('/:walletAddress/stats', getMemberStats);

// Protected routes
router.post('/', verifyToken, createOrUpdateMember);
router.put('/profile', verifyToken, validateMemberUpdate, updateMemberProfile);

export default router;
