import mongoose, { Schema } from 'mongoose';
import { ITreasuryTransaction } from '../types/index.js';

const TreasuryTransactionSchema = new Schema<ITreasuryTransaction>({
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'transfer', 'investment'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  from: {
    type: String,
    lowercase: true,
    trim: true
  },
  to: {
    type: String,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  proposalId: {
    type: Schema.Types.ObjectId,
    ref: 'Proposal'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  transactionHash: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  blockNumber: {
    type: Number
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
TreasuryTransactionSchema.index({ type: 1 });
TreasuryTransactionSchema.index({ status: 1 });
TreasuryTransactionSchema.index({ from: 1 });
TreasuryTransactionSchema.index({ to: 1 });
TreasuryTransactionSchema.index({ proposalId: 1 });
TreasuryTransactionSchema.index({ createdAt: -1 });

// Virtual for transaction value (positive/negative)
TreasuryTransactionSchema.virtual('value').get(function() {
  switch (this.type) {
    case 'deposit':
      return this.amount;
    case 'withdrawal':
    case 'transfer':
    case 'investment':
      return -this.amount;
    default:
      return 0;
  }
});

// Pre-save middleware
TreasuryTransactionSchema.pre('save', function(next) {
  // Validate transaction hash format if provided
  if (this.transactionHash && !this.transactionHash.match(/^0x[a-fA-F0-9]{64}$/)) {
    return next(new Error('Invalid transaction hash format'));
  }
  
  // Auto-complete status if transaction hash is provided
  if (this.transactionHash && this.status === 'pending') {
    this.status = 'completed';
  }
  
  next();
});

// Static methods
TreasuryTransactionSchema.statics.findByType = function(type: string) {
  return this.find({ type }).sort({ createdAt: -1 });
};

TreasuryTransactionSchema.statics.findByStatus = function(status: string) {
  return this.find({ status }).sort({ createdAt: -1 });
};

TreasuryTransactionSchema.statics.findByProposal = function(proposalId: string) {
  return this.find({ proposalId }).sort({ createdAt: -1 });
};

TreasuryTransactionSchema.statics.getTreasuryBalance = async function() {
  const balance = await this.aggregate([
    { $match: { status: 'completed' } },
    {
      $group: {
        _id: null,
        totalDeposits: { $sum: { $cond: [{ $eq: ['$type', 'deposit'] }, '$amount', 0] } },
        totalWithdrawals: { $sum: { $cond: [{ $in: ['$type', ['withdrawal', 'transfer', 'investment']] }, '$amount', 0] } }
      }
    },
    {
      $project: {
        balance: { $subtract: ['$totalDeposits', '$totalWithdrawals'] },
        totalDeposits: 1,
        totalWithdrawals: 1
      }
    }
  ]);
  
  return balance[0] || { balance: 0, totalDeposits: 0, totalWithdrawals: 0 };
};

export default mongoose.model<ITreasuryTransaction>('TreasuryTransaction', TreasuryTransactionSchema);
