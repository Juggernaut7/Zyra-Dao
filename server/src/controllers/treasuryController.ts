import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.ts';
import TreasuryTransaction from '../models/TreasuryTransaction.ts';
import { aiService } from '../services/aiService.ts';
import { blockchainService } from '../services/blockchainService.ts';
import { logger } from '../utils/logger.ts';

/**
 * Get treasury balance and summary
 */
export const getTreasuryBalance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('📊 Calculating treasury balance...');
    const balance = await TreasuryTransaction.getTreasuryBalance();
    console.log('💰 Calculated balance:', balance);
    console.log('💰 Balance details - Deposits:', balance.totalDeposits, 'Withdrawals:', balance.totalWithdrawals, 'Final Balance:', balance.balance);

    // Get recent transactions
    const recentTransactions = await TreasuryTransaction.find({})
      .sort({ createdAt: -1 })
      .limit(10);

    // If no transactions exist, seed some initial data for demo
    if (recentTransactions.length === 0) {
      const initialTransactions = [
        {
          type: 'deposit',
          amount: 500000,
          from: '0x0000000000000000000000000000000000000000',
          to: '0x0000000000000000000000000000000000000000',
          description: 'Initial DAO treasury funding',
          status: 'completed',
          transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          blockNumber: 1000000
        },
        {
          type: 'withdrawal',
          amount: 25000,
          from: '0x0000000000000000000000000000000000000000',
          to: '0x1234567890123456789012345678901234567890',
          description: 'Marketing campaign funding',
          status: 'completed',
          transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          blockNumber: 1000001
        }
      ];

      await TreasuryTransaction.insertMany(initialTransactions);
      
      // Re-fetch balance after seeding
      const newBalance = await TreasuryTransaction.getTreasuryBalance();
      const newTransactions = await TreasuryTransaction.find({})
        .sort({ createdAt: -1 })
        .limit(10);

      return res.json({
        success: true,
        data: {
          balance: newBalance.balance,
          totalDeposits: newBalance.totalDeposits,
          totalWithdrawals: newBalance.totalWithdrawals,
          recentTransactions: newTransactions
        }
      });
    }

    res.json({
      success: true,
      data: {
        balance: balance.balance,
        totalDeposits: balance.totalDeposits,
        totalWithdrawals: balance.totalWithdrawals,
        recentTransactions
      }
    });
  } catch (error) {
    logger.error('Get treasury balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get treasury balance'
    });
  }
};

/**
 * Get all treasury transactions
 */
export const getTreasuryTransactions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const type = req.query.type as string;
    const status = req.query.status as string;

    const filter: any = {};
    if (type) filter.type = type;
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      TreasuryTransaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      TreasuryTransaction.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    logger.error('Get treasury transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get treasury transactions'
    });
  }
};

/**
 * Create a new treasury transaction
 */
export const createTreasuryTransaction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // For demo purposes, allow any authenticated user to create transactions
    // In production, this should be restricted to admins or proposal executors

    const {
      type,
      amount,
      from,
      to,
      description,
      proposalId
    } = req.body;

    console.log('💾 Creating treasury transaction:', { type, amount, from, to, description });
    
    const transaction = new TreasuryTransaction({
      type,
      amount,
      from,
      to,
      description,
      proposalId,
      status: 'completed' // Set to completed so it's included in balance calculation
    });

    await transaction.save();
    console.log('✅ Transaction saved with ID:', transaction._id);
    console.log('💾 Transaction details:', {
      type: transaction.type,
      amount: transaction.amount,
      status: transaction.status,
      from: transaction.from,
      to: transaction.to,
      description: transaction.description
    });

    // Verify the transaction was saved by querying it back
    const savedTransaction = await TreasuryTransaction.findById(transaction._id);
    console.log('🔍 Verification - Transaction found in DB:', savedTransaction ? 'YES' : 'NO');
    if (savedTransaction) {
      console.log('🔍 Verification - Transaction status:', savedTransaction.status);
      console.log('🔍 Verification - Transaction type:', savedTransaction.type);
      console.log('🔍 Verification - Transaction amount:', savedTransaction.amount);
    }

    // Check the balance immediately after saving the transaction
    const currentBalance = await TreasuryTransaction.getTreasuryBalance();
    console.log('💰 Current balance after transaction:', currentBalance);

    logger.info(`New treasury transaction created by ${user.walletAddress}: ${transaction._id}`);

    res.status(201).json({
      success: true,
      message: 'Treasury transaction created successfully',
      data: { transaction }
    });
  } catch (error) {
    logger.error('Create treasury transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create treasury transaction'
    });
  }
};

/**
 * Update treasury transaction status
 */
export const updateTreasuryTransaction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { status, transactionHash, blockNumber } = req.body;

    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const transaction = await TreasuryTransaction.findById(id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    transaction.status = status;
    if (transactionHash) transaction.transactionHash = transactionHash;
    if (blockNumber) transaction.blockNumber = blockNumber;

    await transaction.save();

    logger.info(`Treasury transaction ${id} updated by ${user.walletAddress}`);

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: { transaction }
    });
  } catch (error) {
    logger.error('Update treasury transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update transaction'
    });
  }
};

/**
 * Get AI treasury insights
 */
export const getAITreasuryInsights = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { timeHorizon = '6 months' } = req.query;

    // Get current treasury balance
    const balance = await TreasuryTransaction.getTreasuryBalance();
    
    const insights = await aiService.generateTreasuryInsights(
      balance.balance,
      timeHorizon as string
    );

    res.json({
      success: true,
      data: { insights }
    });
  } catch (error) {
    logger.error('AI treasury insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate treasury insights'
    });
  }
};

/**
 * Get treasury analytics
 */
export const getTreasuryAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period as string);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get transactions for the period
    const transactions = await TreasuryTransaction.find({
      createdAt: { $gte: startDate },
      status: 'completed'
    }).sort({ createdAt: -1 });

    // Calculate analytics
    const analytics = {
      totalTransactions: transactions.length,
      totalVolume: transactions.reduce((sum, tx) => sum + tx.amount, 0),
      transactionTypes: transactions.reduce((acc, tx) => {
        acc[tx.type] = (acc[tx.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      dailyVolume: transactions.reduce((acc, tx) => {
        const day = tx.createdAt.toISOString().split('T')[0];
        acc[day] = (acc[day] || 0) + tx.amount;
        return acc;
      }, {} as Record<string, number>),
      averageTransactionSize: transactions.length > 0 
        ? transactions.reduce((sum, tx) => sum + tx.amount, 0) / transactions.length 
        : 0
    };

    res.json({
      success: true,
      data: { analytics }
    });
  } catch (error) {
    logger.error('Get treasury analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get treasury analytics'
    });
  }
};

/**
 * Get network information
 */
export const getNetworkInfo = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const networkInfo = await blockchainService.getNetworkInfo();
    const gasPrice = await blockchainService.getGasPrice();

    res.json({
      success: true,
      data: {
        network: networkInfo,
        gasPrice
      }
    });
  } catch (error) {
    logger.error('Get network info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get network information'
    });
  }
};
