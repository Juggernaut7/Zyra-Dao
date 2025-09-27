import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ethers } from 'ethers';
import { AuthenticatedRequest } from '../types/index.ts';
import { config } from '../config/index.ts';
import User from '../models/User.ts';
import { logger } from '../utils/logger.ts';

// Verify wallet signature and authenticate user
export const verifyWalletSignature = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { message, signature, address } = req.body;

    if (!message || !signature || !address) {
      return res.status(400).json({
        success: false,
        message: 'Message, signature, and address are required'
      });
    }

    // Verify the signature
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    // Find or create user
    let user = await User.findByWallet(address);
    
    if (!user) {
      // Create new user
      user = new User({
        walletAddress: address,
        role: 'member',
        reputation: 0,
        isVerified: true
      });
      await user.save();
      logger.info(`New user created: ${address}`);
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        walletAddress: user.walletAddress,
        role: user.role
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    logger.error('Wallet signature verification failed:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Verify JWT token
export const verifyToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const token = authHeader.substring(7);
    console.log('🔍 Verifying token:', token.substring(0, 20) + '...');
    console.log('🔍 Using JWT secret:', config.jwtSecret.substring(0, 10) + '...');
    
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    console.log('✅ Token verified successfully:', { userId: decoded.userId });
    
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Token verification failed:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Check user role
export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Check if user is admin
export const requireAdmin = requireRole(['admin']);

// Check if user is admin or moderator
export const requireModerator = requireRole(['admin', 'moderator']);

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, config.jwtSecret) as any;
      const user = await User.findById(decoded.userId);
      req.user = user || undefined;
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
