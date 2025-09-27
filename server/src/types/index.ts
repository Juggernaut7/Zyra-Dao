import { Request } from 'express';
import { Document } from 'mongoose';

// User Types
export interface IUser extends Document {
  walletAddress: string;
  username?: string;
  email?: string;
  role: 'member' | 'admin' | 'moderator';
  reputation: number;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
}

// Proposal Types
export interface IProposal extends Document {
  title: string;
  description: string;
  proposer: string; // wallet address
  amountRequested: number;
  category: 'treasury' | 'governance' | 'grants' | 'infrastructure' | 'marketing';
  status: 'draft' | 'active' | 'committed' | 'revealed' | 'executed' | 'rejected';
  commitStartTime: Date;
  commitEndTime: Date;
  revealStartTime: Date;
  revealEndTime: Date;
  treasuryAction?: {
    type: 'transfer' | 'investment' | 'allocation';
    recipient?: string;
    amount?: number;
    description?: string;
  };
  voteCount: {
    yes: number;
    no: number;
    total: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Vote Types
export interface IVote extends Document {
  proposalId: string;
  voter: string; // wallet address
  commitHash: string;
  vote?: 'yes' | 'no'; // revealed vote
  salt?: string; // revealed salt
  isRevealed: boolean;
  blockNumber?: number;
  transactionHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Treasury Types
export interface ITreasuryTransaction extends Document {
  type: 'deposit' | 'withdrawal' | 'transfer' | 'investment';
  amount: number;
  from?: string;
  to?: string;
  description: string;
  proposalId?: string;
  status: 'pending' | 'completed' | 'failed';
  transactionHash?: string;
  blockNumber?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITreasuryBalance extends Document {
  token: string; // 'ETH', 'USDC', etc.
  balance: number;
  lastUpdated: Date;
}

// Request Types with Authentication
export interface AuthenticatedRequest extends Request {
  user?: IUser;
  token?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Wallet Signature Types
export interface WalletSignature {
  message: string;
  signature: string;
  address: string;
}

// AI Response Types
export interface AIProposalSummary {
  summary: string;
  keyPoints: string[];
  recommendation: 'approve' | 'reject' | 'modify';
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface AITreasuryInsight {
  scenario: string;
  projectedValue: number;
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
  reasoning: string;
}

// Voting Phase Types
export type VotingPhase = 'commit' | 'reveal' | 'completed';

export interface VotingStatus {
  phase: VotingPhase;
  commitEndTime?: Date;
  revealEndTime?: Date;
  timeRemaining?: number;
  canCommit: boolean;
  canReveal: boolean;
}
