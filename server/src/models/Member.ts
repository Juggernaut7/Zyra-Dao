import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IMember extends Document {
  walletAddress: string;
  username?: string;
  email?: string;
  role: 'member' | 'moderator' | 'admin';
  reputation: number;
  votingPower: number;
  isVerified: boolean;
  isActive: boolean;
  joinDate: Date;
  lastActiveAt: Date;
  profile: {
    bio?: string;
    avatar?: string;
    socialLinks: {
      twitter?: string;
      github?: string;
      discord?: string;
    };
  };
  stats: {
    proposalsCreated: number;
    proposalsVoted: number;
    proposalsPassed: number;
    totalContribution: number;
  };
  achievements: Array<{
    type: 'first_proposal' | 'active_voter' | 'treasury_guardian' | 'community_builder';
    earnedAt: Date;
    description?: string;
  }>;
  
  // Virtual fields
  level: string;
  status: string;
  
  // Instance methods
  updateLastActive(): Promise<IMember>;
  addReputation(points: number): Promise<IMember>;
  updateStats(type: string, value?: number): Promise<IMember>;
  addAchievement(type: string, description?: string): Promise<IMember>;
}

export interface IMemberModel extends Model<IMember> {
  findByWallet(walletAddress: string): Promise<IMember | null>;
  getActiveMembers(): Promise<IMember[]>;
  getTopContributors(limit?: number): Promise<IMember[]>;
  getMembersByRole(role: string): Promise<IMember[]>;
}

const memberSchema = new Schema<IMember>({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  role: {
    type: String,
    enum: ['member', 'moderator', 'admin'],
    default: 'member'
  },
  reputation: {
    type: Number,
    default: 0,
    min: 0
  },
  votingPower: {
    type: Number,
    default: 1,
    min: 0
  },
  isVerified: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  },
  profile: {
    bio: {
      type: String,
      maxlength: 500
    },
    avatar: String,
    socialLinks: {
      twitter: String,
      github: String,
      discord: String
    }
  },
  stats: {
    proposalsCreated: {
      type: Number,
      default: 0
    },
    proposalsVoted: {
      type: Number,
      default: 0
    },
    proposalsPassed: {
      type: Number,
      default: 0
    },
    totalContribution: {
      type: Number,
      default: 0
    }
  },
  achievements: [{
    type: {
      type: String,
      enum: ['first_proposal', 'active_voter', 'treasury_guardian', 'community_builder']
    },
    earnedAt: {
      type: Date,
      default: Date.now
    },
    description: String
  }]
}, {
  timestamps: true
});

// Indexes
memberSchema.index({ walletAddress: 1 });
memberSchema.index({ role: 1 });
memberSchema.index({ reputation: -1 });
memberSchema.index({ isActive: 1 });

// Static methods
memberSchema.statics.findByWallet = function(walletAddress: string) {
  return this.findOne({ walletAddress: walletAddress.toLowerCase() });
};

memberSchema.statics.getActiveMembers = function() {
  return this.find({ isActive: true }).sort({ reputation: -1 });
};

memberSchema.statics.getTopContributors = function(limit: number = 10) {
  return this.find({ isActive: true })
    .sort({ 'stats.totalContribution': -1, reputation: -1 })
    .limit(limit);
};

memberSchema.statics.getMembersByRole = function(role: string) {
  return this.find({ role, isActive: true }).sort({ joinDate: -1 });
};

// Instance methods
memberSchema.methods.updateLastActive = function() {
  this.lastActiveAt = new Date();
  return this.save();
};

memberSchema.methods.addReputation = function(points: number) {
  this.reputation += points;
  return this.save();
};

memberSchema.methods.updateStats = function(type: string, value: number = 1) {
  if (this.stats[type] !== undefined) {
    this.stats[type] += value;
  }
  return this.save();
};

memberSchema.methods.addAchievement = function(type: string, description?: string) {
  // Check if achievement already exists
  const existingAchievement = this.achievements.find(a => a.type === type);
  if (!existingAchievement) {
    this.achievements.push({ type, description });
    return this.save();
  }
  return Promise.resolve(this);
};

// Virtual for member level based on reputation
memberSchema.virtual('level').get(function() {
  if (this.reputation >= 1000) return 'Legendary';
  if (this.reputation >= 500) return 'Expert';
  if (this.reputation >= 200) return 'Advanced';
  if (this.reputation >= 100) return 'Intermediate';
  if (this.reputation >= 50) return 'Beginner';
  return 'Newcomer';
});

// Virtual for member status
memberSchema.virtual('status').get(function() {
  if (!this.isActive) return 'Inactive';
  const daysSinceActive = (Date.now() - this.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceActive > 30) return 'Dormant';
  if (daysSinceActive > 7) return 'Away';
  return 'Active';
});

// Ensure virtual fields are serialized
memberSchema.set('toJSON', { virtuals: true });
memberSchema.set('toObject', { virtuals: true });

const Member = mongoose.model<IMember, IMemberModel>('Member', memberSchema);

export default Member;
