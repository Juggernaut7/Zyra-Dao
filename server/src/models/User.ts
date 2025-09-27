import mongoose, { Schema } from 'mongoose';
import { IUser } from '../types/index.js';

const UserSchema = new Schema<IUser>({
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
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  role: {
    type: String,
    enum: ['member', 'admin', 'moderator'],
    default: 'member'
  },
  reputation: {
    type: Number,
    default: 0,
    min: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
UserSchema.index({ role: 1 });
UserSchema.index({ reputation: -1 });
UserSchema.index({ createdAt: -1 });

// Virtual for user activity level
UserSchema.virtual('activityLevel').get(function() {
  const daysSinceLastActive = (Date.now() - this.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceLastActive <= 7) return 'active';
  if (daysSinceLastActive <= 30) return 'moderate';
  return 'inactive';
});

// Pre-save middleware
UserSchema.pre('save', function(next) {
  this.lastActiveAt = new Date();
  next();
});

// Static methods
UserSchema.statics.findByWallet = function(walletAddress: string) {
  return this.findOne({ walletAddress: walletAddress.toLowerCase() });
};

UserSchema.statics.findActiveUsers = function() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return this.find({ lastActiveAt: { $gte: thirtyDaysAgo } });
};

export default mongoose.model<IUser>('User', UserSchema);
