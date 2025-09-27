import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.ts';
import { blockchainService } from '../services/blockchainService.ts';
import { logger } from '../utils/logger.ts';

/**
 * Authenticate user with wallet signature
 */
export const authenticate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const walletAddress = req.user?.walletAddress;
    const token = req.token;

    if (!walletAddress || !token) {
      logger.error('Authentication failed: missing walletAddress or token', { walletAddress, hasToken: !!token });
      return res.status(500).json({
        success: false,
        message: 'Authentication failed'
      });
    }

    logger.info(`User authenticated: ${walletAddress}`);

    res.json({
      success: true,
      message: 'Authentication successful',
      data: {
        user: {
          id: req.user?._id,
          walletAddress: req.user?.walletAddress,
          username: req.user?.username,
          role: req.user?.role,
          reputation: req.user?.reputation,
          isVerified: req.user?.isVerified
        },
        token
      }
    });
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Get wallet balance
    let balance = '0';
    try {
      balance = await blockchainService.getBalance(user.walletAddress);
    } catch (error) {
      logger.warn('Failed to get wallet balance:', error);
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          walletAddress: user.walletAddress,
          username: user.username,
          email: user.email,
          role: user.role,
          reputation: user.reputation,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
          lastActiveAt: user.lastActiveAt
        },
        balance
      }
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile'
    });
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    const { username, email } = req.body;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Update user fields
    if (username !== undefined) {
      user.username = username;
    }
    if (email !== undefined) {
      user.email = email;
    }

    await user.save();

    logger.info(`User profile updated: ${user.walletAddress}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          walletAddress: user.walletAddress,
          username: user.username,
          email: user.email,
          role: user.role,
          reputation: user.reputation,
          isVerified: user.isVerified
        }
      }
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

/**
 * Verify wallet signature for authentication
 */
export const verifySignature = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { message, signature, address } = req.body;

    if (!message || !signature || !address) {
      return res.status(400).json({
        success: false,
        message: 'Message, signature, and address are required'
      });
    }

    // Verify the signature
    const recoveredAddress = await blockchainService.verifySignature(message, signature);
    
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    res.json({
      success: true,
      message: 'Signature verified successfully',
      data: {
        verified: true,
        address: recoveredAddress
      }
    });
  } catch (error) {
    logger.error('Signature verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Signature verification failed'
    });
  }
};
