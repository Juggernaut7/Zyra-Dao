import { Router } from 'express';
import authRoutes from './auth.ts';
import proposalRoutes from './proposals.ts';
import votingRoutes from './voting.ts';
import treasuryRoutes from './treasury.ts';
import aiRoutes from './ai.ts';
import memberRoutes from './members.ts';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Zyra Backend API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/proposals', proposalRoutes);
router.use('/voting', votingRoutes);
router.use('/treasury', treasuryRoutes);
router.use('/ai', aiRoutes);
router.use('/members', memberRoutes);

// 404 handler
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

export default router;
