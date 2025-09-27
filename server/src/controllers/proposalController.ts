import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.ts';
import Proposal from '../models/Proposal.ts';
import Vote from '../models/Vote.ts';
import { aiService } from '../services/aiService.ts';
import { logger } from '../utils/logger.ts';

/**
 * Create a new proposal
 */
export const createProposal = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const {
      title,
      description,
      amountRequested,
      category,
      commitEndTime,
      revealEndTime,
      treasuryAction
    } = req.body;

    const proposal = new Proposal({
      title,
      description,
      proposer: user.walletAddress,
      amountRequested,
      category,
      commitEndTime: new Date(commitEndTime),
      revealEndTime: new Date(revealEndTime),
      treasuryAction,
      status: 'active'
    });

    await proposal.save();

    logger.info(`New proposal created by ${user.walletAddress}: ${proposal._id}`);

    res.status(201).json({
      success: true,
      message: 'Proposal created successfully',
      data: { proposal }
    });
  } catch (error) {
    logger.error('Create proposal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create proposal'
    });
  }
};

/**
 * Get all proposals with pagination and filtering
 */
export const getProposals = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const category = req.query.category as string;
    const status = req.query.status as string;
    const proposer = req.query.proposer as string;

    const filter: any = {};

    if (category) filter.category = category;
    if (status) filter.status = status;
    if (proposer) filter.proposer = proposer.toLowerCase();

    const skip = (page - 1) * limit;

    const [proposals, total] = await Promise.all([
      Proposal.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('proposer', 'walletAddress username'),
      Proposal.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: proposals,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    logger.error('Get proposals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get proposals'
    });
  }
};

/**
 * Get a specific proposal by ID
 */
export const getProposal = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const proposal = await Proposal.findById(id);
    
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    // Get vote statistics
    const voteStats = await Vote.getVoteStats(id);

    res.json({
      success: true,
      data: {
        proposal,
        voteStats
      }
    });
  } catch (error) {
    logger.error('Get proposal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get proposal'
    });
  }
};

/**
 * Update proposal status (admin only)
 */
export const updateProposalStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { status } = req.body;

    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const proposal = await Proposal.findById(id);
    
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    proposal.status = status;
    await proposal.save();

    logger.info(`Proposal ${id} status updated to ${status} by ${user.walletAddress}`);

    res.json({
      success: true,
      message: 'Proposal status updated successfully',
      data: { proposal }
    });
  } catch (error) {
    logger.error('Update proposal status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update proposal status'
    });
  }
};

/**
 * Get AI summary for a proposal
 */
export const getAIProposalSummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const proposal = await Proposal.findById(id);
    
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    const proposalText = `${proposal.title}\n\n${proposal.description}`;
    const summary = await aiService.summarizeProposal(proposalText);

    res.json({
      success: true,
      data: { summary }
    });
  } catch (error) {
    logger.error('AI proposal summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI summary'
    });
  }
};

/**
 * Get user's proposals
 */
export const getUserProposals = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [proposals, total] = await Promise.all([
      Proposal.findByProposer(user.walletAddress)
        .skip(skip)
        .limit(limit),
      Proposal.countDocuments({ proposer: user.walletAddress })
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: proposals,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    logger.error('Get user proposals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user proposals'
    });
  }
};

/**
 * Delete a proposal (proposer only)
 */
export const deleteProposal = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const proposal = await Proposal.findById(id);
    
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    // Check if user is the proposer or admin
    if (proposal.proposer !== user.walletAddress && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only the proposer or admin can delete this proposal'
      });
    }

    // Check if proposal can be deleted (only draft status)
    if (proposal.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft proposals can be deleted'
      });
    }

    await Proposal.findByIdAndDelete(id);

    logger.info(`Proposal ${id} deleted by ${user.walletAddress}`);

    res.json({
      success: true,
      message: 'Proposal deleted successfully'
    });
  } catch (error) {
    logger.error('Delete proposal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete proposal'
    });
  }
};
