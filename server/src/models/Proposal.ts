import mongoose, { Schema } from 'mongoose';
import { IProposal } from '../types/index.js';

const ProposalSchema = new Schema<IProposal>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000
  },
  proposer: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  amountRequested: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    enum: ['treasury', 'governance', 'grants', 'infrastructure', 'marketing'],
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'committed', 'revealed', 'executed', 'rejected'],
    default: 'draft'
  },
  commitStartTime: {
    type: Date,
    default: Date.now
  },
  commitEndTime: {
    type: Date,
    required: true
  },
  revealStartTime: {
    type: Date
  },
  revealEndTime: {
    type: Date,
    required: true
  },
  treasuryAction: {
    type: {
      type: String,
      enum: ['transfer', 'investment', 'allocation']
    },
    recipient: String,
    amount: Number,
    description: String
  },
  voteCount: {
    yes: {
      type: Number,
      default: 0
    },
    no: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
ProposalSchema.index({ proposer: 1 });
ProposalSchema.index({ status: 1 });
ProposalSchema.index({ category: 1 });
ProposalSchema.index({ createdAt: -1 });
ProposalSchema.index({ commitEndTime: 1 });
ProposalSchema.index({ revealEndTime: 1 });

// Compound indexes
ProposalSchema.index({ status: 1, category: 1 });
ProposalSchema.index({ proposer: 1, status: 1 });

// Virtual for voting progress
ProposalSchema.virtual('votingProgress').get(function() {
  if (this.voteCount.total === 0) return 0;
  return Math.round((this.voteCount.yes / this.voteCount.total) * 100);
});

// Virtual for time remaining
ProposalSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  if (now < this.commitEndTime) {
    return Math.max(0, this.commitEndTime.getTime() - now.getTime());
  } else if (now < this.revealEndTime) {
    return Math.max(0, this.revealEndTime.getTime() - now.getTime());
  }
  return 0;
});

// Virtual for current phase
ProposalSchema.virtual('currentPhase').get(function() {
  const now = new Date();
  if (now < this.commitEndTime) return 'commit';
  if (now < this.revealEndTime) return 'reveal';
  return 'completed';
});

// Pre-save middleware
ProposalSchema.pre('save', function(next) {
  // Auto-set reveal start time when commit phase ends
  if (this.isModified('status') && this.status === 'committed') {
    this.revealStartTime = new Date();
  }
  
  // Calculate total votes
  this.voteCount.total = this.voteCount.yes + this.voteCount.no;
  
  next();
});

// Static methods
ProposalSchema.statics.findActive = function() {
  const now = new Date();
  return this.find({
    status: 'active',
    $or: [
      { commitEndTime: { $gt: now } },
      { revealEndTime: { $gt: now } }
    ]
  });
};

ProposalSchema.statics.findByCategory = function(category: string) {
  return this.find({ category }).sort({ createdAt: -1 });
};

ProposalSchema.statics.findByProposer = function(proposer: string) {
  return this.find({ proposer: proposer.toLowerCase() }).sort({ createdAt: -1 });
};

export default mongoose.model<IProposal>('Proposal', ProposalSchema);
