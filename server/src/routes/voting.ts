import { Router } from 'express';
import {
  commitVote,
  revealVote,
  getVotingStatus,
  getUserVote,
  getProposalVotes,
  generateCommitHash
} from '../controllers/votingController.ts';
import {
  verifyToken,
  requireAdmin
} from '../middleware/auth.ts';
import {
  validateVoteCommit,
  validateVoteReveal
} from '../middleware/validation.ts';
import { votingLimiter } from '../middleware/rateLimiting.ts';

const router = Router();

// Public routes
router.get('/proposal/:id/status', getVotingStatus);

// Protected routes
router.post('/commit', verifyToken, votingLimiter, validateVoteCommit, commitVote);
router.post('/reveal', verifyToken, votingLimiter, validateVoteReveal, revealVote);
router.get('/proposal/:id/my-vote', verifyToken, getUserVote);
router.post('/generate-commit-hash', generateCommitHash);

// Admin routes
router.get('/proposal/:id/votes', verifyToken, requireAdmin, getProposalVotes);

export default router;
