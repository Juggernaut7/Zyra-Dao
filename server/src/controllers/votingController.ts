import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.ts';
import Proposal from '../models/Proposal.ts';
import Vote from '../models/Vote.ts';
import { blockchainService } from '../services/blockchainService.ts';
import { logger } from '../utils/logger.ts';

/**
 * Commit a vote for a proposal
 */
export const commitVote = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    const { proposalId, commitHash } = req.body;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const proposal = await Proposal.findById(proposalId);
    
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    // Check if proposal is in commit phase
    const now = new Date();
    if (now > proposal.commitEndTime) {
      return res.status(400).json({
        success: false,
        message: 'Commit phase has ended'
      });
    }

    if (proposal.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Proposal is not active for voting'
      });
    }

    // Check if user has already voted
    const existingVote = await Vote.findOne({
      proposalId,
      voter: user.walletAddress
    });

    if (existingVote) {
      return res.status(400).json({
        success: false,
        message: 'You have already committed a vote for this proposal'
      });
    }

    // Create new vote
    const vote = new Vote({
      proposalId,
      voter: user.walletAddress,
      commitHash,
      isRevealed: false
    });

    await vote.save();

    logger.info(`Vote committed by ${user.walletAddress} for proposal ${proposalId}`);

    res.status(201).json({
      success: true,
      message: 'Vote committed successfully',
      data: { vote }
    });
  } catch (error) {
    logger.error('Commit vote error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to commit vote'
    });
  }
};

/**
 * Reveal a vote for a proposal
 */
export const revealVote = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    const { proposalId, vote, salt } = req.body;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const proposal = await Proposal.findById(proposalId);
    
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    // Check if proposal is in reveal phase
    const now = new Date();
    if (now < proposal.commitEndTime || now > proposal.revealEndTime) {
      return res.status(400).json({
        success: false,
        message: 'Not in reveal phase'
      });
    }

    // Find the committed vote
    const committedVote = await Vote.findOne({
      proposalId,
      voter: user.walletAddress
    });

    if (!committedVote) {
      return res.status(400).json({
        success: false,
        message: 'No committed vote found for this proposal'
      });
    }

    if (committedVote.isRevealed) {
      return res.status(400).json({
        success: false,
        message: 'Vote has already been revealed'
      });
    }

    // Verify the reveal matches the commit
    const expectedCommitHash = blockchainService.generateCommitHash(vote, salt);
    
    if (expectedCommitHash !== committedVote.commitHash) {
      return res.status(400).json({
        success: false,
        message: 'Revealed vote does not match committed hash'
      });
    }

    // Update the vote with revealed information
    committedVote.vote = vote;
    committedVote.salt = salt;
    committedVote.isRevealed = true;
    await committedVote.save();

    // Update proposal vote count
    if (vote === 'yes') {
      proposal.voteCount.yes += 1;
    } else {
      proposal.voteCount.no += 1;
    }
    proposal.voteCount.total = proposal.voteCount.yes + proposal.voteCount.no;
    await proposal.save();

    logger.info(`Vote revealed by ${user.walletAddress} for proposal ${proposalId}: ${vote}`);

    res.json({
      success: true,
      message: 'Vote revealed successfully',
      data: { vote: committedVote }
    });
  } catch (error) {
    logger.error('Reveal vote error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reveal vote'
    });
  }
};

/**
 * Get voting status for a proposal
 */
export const getVotingStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const proposal = await Proposal.findById(id);
    
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    const now = new Date();
    let phase: 'commit' | 'reveal' | 'completed' = 'completed';
    let timeRemaining = 0;

    if (now < proposal.commitEndTime) {
      phase = 'commit';
      timeRemaining = proposal.commitEndTime.getTime() - now.getTime();
    } else if (now < proposal.revealEndTime) {
      phase = 'reveal';
      timeRemaining = proposal.revealEndTime.getTime() - now.getTime();
    }

    const voteStats = await Vote.getVoteStats(id);

    res.json({
      success: true,
      data: {
        phase,
        timeRemaining,
        commitEndTime: proposal.commitEndTime,
        revealEndTime: proposal.revealEndTime,
        canCommit: phase === 'commit',
        canReveal: phase === 'reveal',
        voteStats
      }
    });
  } catch (error) {
    logger.error('Get voting status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get voting status'
    });
  }
};

/**
 * Get user's vote for a proposal
 */
export const getUserVote = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const vote = await Vote.findOne({
      proposalId: id,
      voter: user.walletAddress
    });

    if (!vote) {
      return res.json({
        success: true,
        data: { hasVoted: false }
      });
    }

    res.json({
      success: true,
      data: {
        hasVoted: true,
        isCommitted: !!vote.commitHash,
        isRevealed: vote.isRevealed,
        vote: vote.isRevealed ? vote.vote : null
      }
    });
  } catch (error) {
    logger.error('Get user vote error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user vote'
    });
  }
};

/**
 * Get all votes for a proposal (admin only)
 */
export const getProposalVotes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const votes = await Vote.find({ proposalId: id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: votes
    });
  } catch (error) {
    logger.error('Get proposal votes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get proposal votes'
    });
  }
};

/**
 * Generate commit hash for voting
 */
export const generateCommitHash = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { vote, salt } = req.body;

    if (!vote || !salt) {
      return res.status(400).json({
        success: false,
        message: 'Vote and salt are required'
      });
    }

    if (!['yes', 'no'].includes(vote)) {
      return res.status(400).json({
        success: false,
        message: 'Vote must be either "yes" or "no"'
      });
    }

    const commitHash = blockchainService.generateCommitHash(vote, salt);

    res.json({
      success: true,
      data: { commitHash }
    });
  } catch (error) {
    logger.error('Generate commit hash error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate commit hash'
    });
  }
};
