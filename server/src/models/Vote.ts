import mongoose, { Schema } from 'mongoose';
import { IVote } from '../types/index.js';

const VoteSchema = new Schema<IVote>({
  proposalId: {
    type: Schema.Types.ObjectId,
    ref: 'Proposal',
    required: true,
    index: true
  },
  voter: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  commitHash: {
    type: String,
    required: true,
    trim: true
  },
  vote: {
    type: String,
    enum: ['yes', 'no']
  },
  salt: {
    type: String,
    trim: true
  },
  isRevealed: {
    type: Boolean,
    default: false
  },
  blockNumber: {
    type: Number
  },
  transactionHash: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index to ensure one vote per user per proposal
VoteSchema.index({ proposalId: 1, voter: 1 }, { unique: true });

// Indexes for better performance
VoteSchema.index({ voter: 1 });
VoteSchema.index({ isRevealed: 1 });
VoteSchema.index({ createdAt: -1 });

// Virtual for vote validation
VoteSchema.virtual('isValidCommit').get(function() {
  return this.commitHash && this.commitHash.length === 66; // 0x + 64 hex chars
});

// Virtual for vote validation
VoteSchema.virtual('isValidReveal').get(function() {
  return this.vote && this.salt && this.isRevealed;
});

// Pre-save middleware
VoteSchema.pre('save', function(next) {
  // Validate commit hash format
  if (this.commitHash && !this.commitHash.match(/^0x[a-fA-F0-9]{64}$/)) {
    return next(new Error('Invalid commit hash format'));
  }
  
  // If vote is revealed, ensure salt is present
  if (this.isRevealed && !this.salt) {
    return next(new Error('Salt is required for revealed votes'));
  }
  
  next();
});

// Static methods
VoteSchema.statics.findByProposal = function(proposalId: string) {
  return this.find({ proposalId }).populate('proposalId');
};

VoteSchema.statics.findByVoter = function(voter: string) {
  return this.find({ voter: voter.toLowerCase() }).populate('proposalId');
};

VoteSchema.statics.findUnrevealed = function() {
  return this.find({ isRevealed: false });
};

VoteSchema.statics.getVoteStats = async function(proposalId: string) {
  const stats = await this.aggregate([
    { $match: { proposalId: new mongoose.Types.ObjectId(proposalId) } },
    {
      $group: {
        _id: null,
        totalCommits: { $sum: 1 },
        totalReveals: { $sum: { $cond: ['$isRevealed', 1, 0] } },
        yesVotes: { $sum: { $cond: [{ $eq: ['$vote', 'yes'] }, 1, 0] } },
        noVotes: { $sum: { $cond: [{ $eq: ['$vote', 'no'] }, 1, 0] } }
      }
    }
  ]);
  
  return stats[0] || {
    totalCommits: 0,
    totalReveals: 0,
    yesVotes: 0,
    noVotes: 0
  };
};

export default mongoose.model<IVote>('Vote', VoteSchema);
