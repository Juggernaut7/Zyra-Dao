import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.ts';
import Member from '../models/Member.ts';
import Proposal from '../models/Proposal.ts';
import Vote from '../models/Vote.ts';
import { logger } from '../utils/logger.ts';

/**
 * Get all members with pagination and filtering
 */
export const getMembers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const role = req.query.role as string;
    const search = req.query.search as string;
    const sortBy = req.query.sortBy as string || 'reputation';
    const sortOrder = req.query.sortOrder as string || 'desc';

    const filter: any = { isActive: true };
    
    if (role) {
      filter.role = role;
    }
    
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { walletAddress: { $regex: search, $options: 'i' } },
        { 'profile.bio': { $regex: search, $options: 'i' } }
      ];
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const members = await Member.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-__v');

    const total = await Member.countDocuments(filter);

    res.json({
      success: true,
      data: {
        members,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get members error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch members'
    });
  }
};

/**
 * Get member by wallet address
 */
export const getMember = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { walletAddress } = req.params;

    const member = await Member.findOne({ 
      walletAddress: walletAddress.toLowerCase(),
      isActive: true 
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Get member's proposals
    const proposals = await Proposal.find({ proposer: walletAddress })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title status amountRequested createdAt');

    // Get member's votes
    const votes = await Vote.find({ voter: walletAddress })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('proposalId vote createdAt');

    res.json({
      success: true,
      data: {
        member,
        proposals,
        votes
      }
    });
  } catch (error) {
    logger.error('Get member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch member details'
    });
  }
};

/**
 * Update member profile
 */
export const updateMemberProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    const { username, email, bio, socialLinks } = req.body;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const member = await Member.findByWallet(user.walletAddress);
    
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Update allowed fields
    if (username) member.username = username;
    if (email) member.email = email;
    if (bio) member.profile.bio = bio;
    if (socialLinks) {
      member.profile.socialLinks = {
        ...member.profile.socialLinks,
        ...socialLinks
      };
    }

    await member.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { member }
    });
  } catch (error) {
    logger.error('Update member profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

/**
 * Get member statistics
 */
export const getMemberStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { walletAddress } = req.params;

    // Get member
    const member = await Member.findOne({ 
      walletAddress: walletAddress.toLowerCase() 
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Get detailed statistics
    const totalProposals = await Proposal.countDocuments({ proposer: walletAddress });
    const activeProposals = await Proposal.countDocuments({ 
      proposer: walletAddress, 
      status: 'active' 
    });
    const passedProposals = await Proposal.countDocuments({ 
      proposer: walletAddress, 
      status: 'executed' 
    });
    
    const totalVotes = await Vote.countDocuments({ voter: walletAddress });
    const yesVotes = await Vote.countDocuments({ 
      voter: walletAddress, 
      vote: 'yes' 
    });
    const noVotes = await Vote.countDocuments({ 
      voter: walletAddress, 
      vote: 'no' 
    });

    // Get participation rate
    const totalActiveProposals = await Proposal.countDocuments({ status: 'active' });
    const participationRate = totalActiveProposals > 0 
      ? (totalVotes / totalActiveProposals) * 100 
      : 0;

    res.json({
      success: true,
      data: {
        basic: {
          reputation: member.reputation,
          votingPower: member.votingPower,
          level: member.level,
          status: member.status,
          joinDate: member.joinDate
        },
        proposals: {
          total: totalProposals,
          active: activeProposals,
          passed: passedProposals,
          successRate: totalProposals > 0 ? (passedProposals / totalProposals) * 100 : 0
        },
        voting: {
          total: totalVotes,
          yes: yesVotes,
          no: noVotes,
          participationRate: Math.round(participationRate * 100) / 100
        },
        achievements: member.achievements
      }
    });
  } catch (error) {
    logger.error('Get member stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch member statistics'
    });
  }
};

/**
 * Get member leaderboard
 */
export const getLeaderboard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const type = req.query.type as string || 'reputation';
    const limit = parseInt(req.query.limit as string) || 10;

    let sortField = 'reputation';
    if (type === 'proposals') sortField = 'stats.proposalsCreated';
    if (type === 'voting') sortField = 'stats.proposalsVoted';
    if (type === 'contribution') sortField = 'stats.totalContribution';

    const members = await Member.find({ isActive: true })
      .sort({ [sortField]: -1 })
      .limit(limit)
      .select('walletAddress username reputation stats achievements level');

    res.json({
      success: true,
      data: { members }
    });
  } catch (error) {
    logger.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard'
    });
  }
};

/**
 * Create or update member (called when user connects wallet)
 */
export const createOrUpdateMember = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address is required'
      });
    }

    let member = await Member.findByWallet(walletAddress);

    if (!member) {
      // Create new member
      member = new Member({
        walletAddress: walletAddress.toLowerCase(),
        role: 'member',
        reputation: 0,
        votingPower: 1,
        isVerified: true,
        isActive: true
      });
      
      await member.save();
      logger.info(`New member created: ${walletAddress}`);
    } else {
      // Update last active
      member.updateLastActive();
    }

    res.json({
      success: true,
      data: { member }
    });
  } catch (error) {
    logger.error('Create or update member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create or update member'
    });
  }
};

/**
 * Get DAO overview statistics
 */
export const getDAOStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const totalMembers = await Member.countDocuments({ isActive: true });
    const totalProposals = await Proposal.countDocuments();
    const activeProposals = await Proposal.countDocuments({ status: 'active' });
    const totalVotes = await Vote.countDocuments();
    
    const topContributors = await Member.find({ isActive: true })
      .sort({ 'stats.totalContribution': -1 })
      .limit(5)
      .select('walletAddress username reputation stats.totalContribution');

    const recentMembers = await Member.find({ isActive: true })
      .sort({ joinDate: -1 })
      .limit(5)
      .select('walletAddress username joinDate');

    const memberGrowth = await Member.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: {
            year: { $year: '$joinDate' },
            month: { $month: '$joinDate' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalMembers,
          totalProposals,
          activeProposals,
          totalVotes
        },
        topContributors,
        recentMembers,
        memberGrowth
      }
    });
  } catch (error) {
    logger.error('Get DAO stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch DAO statistics'
    });
  }
};
