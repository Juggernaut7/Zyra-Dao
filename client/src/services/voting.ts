import { ethers, BrowserProvider } from 'ethers';
import type { Signer } from 'ethers';
import { api } from './api';

// Contract ABIs (from deployed contract)
const VOTING_ABI = [
  "function commitVote(uint256 _proposalId, bytes32 _commitHash) external",
  "function revealVote(uint256 _proposalId, bool _vote, uint256 _salt) external",
  "function createProposal(string _title, string _description, uint256 _amountRequested, uint256 _commitDuration, uint256 _revealDuration) external returns (uint256)",
  "function getProposal(uint256 _proposalId) external view returns (string, string, address, uint256, uint256, uint256, uint256, uint256, bool, bool)",
  "function getVotingResults(uint256 _proposalId) external view returns (uint256, uint256, uint256, uint256, bool, bool)",
  "function getUserVoteStatus(uint256 _proposalId, address _user) external view returns (bool, bool, bool, bytes32)",
  "function getProposalPhase(uint256 _proposalId) external view returns (uint8)",
  "function proposalCount() external view returns (uint256)",
  "event VoteCommitted(uint256 indexed proposalId, address indexed voter, bytes32 commitHash)",
  "event VoteRevealed(uint256 indexed proposalId, address indexed voter, bool vote, uint256 weight)"
];

// Treasury operations are handled by backend API, not direct contract calls

export interface VoteResult {
  proposalId: string;
  yesVotes: number;
  noVotes: number;
  totalVotes: number;
  totalCommittedVotes: number;
  totalRevealedVotes: number;
  totalVoters: number;
  hasCommitted: boolean;
  hasRevealed: boolean;
  userVote?: boolean;
}

export interface CommitResult {
  txHash: string;
  proposalId: string;
  commitHash: string;
}

export interface RevealResult {
  txHash: string;
  proposalId: string;
  vote: boolean;
}

class VotingService {
  private votingContract: ethers.Contract | null = null;
  // Treasury operations handled by backend API
  private provider: BrowserProvider | null = null;
  private signer: Signer | null = null;

  // Contract addresses from environment
  private readonly VOTING_ADDRESS = (import.meta as any).env?.VITE_CONTRACT_VOTING;

  constructor() {
    // Initialize contracts when wallet is connected
  }

  public async initializeContracts() {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      this.provider = new BrowserProvider((window as any).ethereum);
      this.signer = await this.provider.getSigner();

      if (this.VOTING_ADDRESS) {
        this.votingContract = new ethers.Contract(
          this.VOTING_ADDRESS,
          VOTING_ABI,
          this.signer
        );
      }

      // Treasury operations are handled by backend API, not direct contract calls

      // Listen for network changes
      (window as any).ethereum.on('chainChanged', () => {
        console.log('Network changed, reinitializing contracts...');
        this.votingContract = null;
        // Treasury contract not used - operations via backend API
        this.provider = null;
        this.signer = null;
      });
    }
  }

  public async commitVote(proposalId: string, vote: boolean, salt: string): Promise<CommitResult> {
    if (!this.votingContract || !this.signer) {
      await this.initializeContracts();
      if (!this.votingContract || !this.signer) {
        throw new Error('Wallet not connected or voting contract not available');
      }
    }

    try {
      // Generate commit hash
      const commitHash = this.generateCommitHash(vote, salt);
      
      // Convert proposalId to uint256
      const proposalIdUint = BigInt(proposalId);
      
      console.log('Committing vote:', {
        proposalId,
        proposalIdUint: proposalIdUint.toString(),
        vote,
        salt,
        commitHash,
        contractAddress: this.VOTING_ADDRESS
      });
      
      // Call contract
      const tx = await this.votingContract.commitVote(proposalIdUint, commitHash);
      await tx.wait();

      // Store vote data locally for reveal
      this.storeVoteData(proposalId, { vote, salt, commitHash });

      return {
        txHash: tx.hash,
        proposalId,
        commitHash: commitHash,
      };
    } catch (error) {
      console.error('Failed to commit vote:', error);
      throw error;
    }
  }

  public async revealVote(proposalId: string): Promise<RevealResult> {
    if (!this.votingContract || !this.signer) {
      await this.initializeContracts();
      if (!this.votingContract || !this.signer) {
        throw new Error('Wallet not connected or voting contract not available');
      }
    }

    try {
      // Get stored vote data
      const voteData = this.getVoteData(proposalId);
      if (!voteData) {
        throw new Error('No vote data found for this proposal');
      }

      // Convert proposalId to uint256
      const proposalIdUint = BigInt(proposalId);
      
      console.log('Revealing vote:', {
        proposalId,
        proposalIdUint: proposalIdUint.toString(),
        vote: voteData.vote,
        salt: voteData.salt,
        contractAddress: this.VOTING_ADDRESS
      });
      
      // Call contract
      const tx = await this.votingContract.revealVote(
        proposalIdUint,
        voteData.vote,
        BigInt(voteData.salt)
      );
      await tx.wait();

      // Clear stored vote data
      this.clearVoteData(proposalId);

      return {
        txHash: tx.hash,
        proposalId,
        vote: voteData.vote,
      };
    } catch (error) {
      console.error('Failed to reveal vote:', error);
      throw error;
    }
  }

  public async getVoteResult(proposalId: string): Promise<VoteResult> {
    if (!this.votingContract || !this.signer) {
      await this.initializeContracts();
      if (!this.votingContract || !this.signer) {
        throw new Error('Wallet not connected or voting contract not available');
      }
    }

    try {
      const proposalIdUint = BigInt(proposalId);
      const userAddress = await this.signer.getAddress();

      console.log('Getting vote result:', {
        proposalId,
        proposalIdUint: proposalIdUint.toString(),
        userAddress,
        contractAddress: this.VOTING_ADDRESS
      });

      // Get voting results
      const [totalCommittedVotes, totalRevealedVotes, yesCount, noCount, hasQuorum, hasMajority] = 
        await this.votingContract.getVotingResults(proposalIdUint);
      
      // Get user vote status
      const [hasCommitted, hasRevealed, userVote, commitHash] = 
        await this.votingContract.getUserVoteStatus(proposalIdUint, userAddress);

      console.log('🔍 DETAILED Vote results for proposal', proposalId, ':', {
        proposalIdUint: proposalIdUint.toString(),
        userAddress,
        totalCommittedVotes: totalCommittedVotes.toString(),
        totalRevealedVotes: totalRevealedVotes.toString(),
        yesCount: yesCount.toString(),
        noCount: noCount.toString(),
        hasQuorum,
        hasMajority,
        hasCommitted,
        hasRevealed,
        userVote,
        commitHash
      });

      return {
        proposalId,
        yesVotes: Number(yesCount),
        noVotes: Number(noCount),
        totalVotes: Number(totalRevealedVotes),
        totalCommittedVotes: Number(totalCommittedVotes),
        totalRevealedVotes: Number(totalRevealedVotes),
        totalVoters: 100, // This should ideally come from the contract, but using a reasonable default
        hasCommitted,
        hasRevealed,
        userVote: hasRevealed ? userVote : undefined,
      };
    } catch (error) {
      console.error('Failed to get vote result:', error);
      throw error;
    }
  }

  // Treasury operations are handled by backend API, not direct contract calls
  // Use the API service for treasury operations instead

  private generateCommitHash(vote: boolean, salt: string): string {
    const voteValue = vote ? 1 : 0;
    const saltValue = BigInt(salt);
    const combined = ethers.solidityPacked(['uint8', 'uint256'], [voteValue, saltValue]);
    return ethers.keccak256(combined);
  }

  private storeVoteData(proposalId: string, voteData: { vote: boolean; salt: string; commitHash: string }) {
    const key = `vote_${proposalId}`;
    localStorage.setItem(key, JSON.stringify(voteData));
  }

  private getVoteData(proposalId: string): { vote: boolean; salt: string; commitHash: string } | null {
    const key = `vote_${proposalId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  private clearVoteData(proposalId: string): void {
    const key = `vote_${proposalId}`;
    localStorage.removeItem(key);
  }

  // Helper method to generate a random salt
  public generateSalt(): string {
    return ethers.hexlify(ethers.randomBytes(32));
  }

  // Method to check if user can vote (not implemented in contract, using backend)
  public async canUserVote(proposalId: string): Promise<boolean> {
    try {
      const response = await api.voting.getVotes(proposalId);
      return response.data.canVote;
    } catch (error) {
      console.error('Failed to check voting eligibility:', error);
      return false;
    }
  }

  // Method to get proposal status from contract
  public async getProposalStatus(proposalId: string): Promise<{
    commitEndTime: number;
    revealEndTime: number;
    isActive: boolean;
    isExecuted: boolean;
  }> {
    if (!this.votingContract) {
      throw new Error('Voting contract not available');
    }

    try {
      const proposalIdUint = BigInt(proposalId);
      const [title, description, proposer, amountRequested, commitStartTime, commitEndTime, revealStartTime, revealEndTime, executed, exists] = 
        await this.votingContract.getProposal(proposalIdUint);
      
      const now = Math.floor(Date.now() / 1000);
      const isActive = now < Number(revealEndTime);

      return {
        commitEndTime: Number(commitEndTime) * 1000, // Convert to milliseconds
        revealEndTime: Number(revealEndTime) * 1000, // Convert to milliseconds
        isActive,
        isExecuted: executed,
      };
    } catch (error) {
      console.error('Failed to get proposal status:', error);
      throw error;
    }
  }

  // Method to create a new proposal
  public async createProposal(
    title: string, 
    description: string, 
    amountRequested: string, 
    commitDuration: number = 86400, // 24 hours in seconds (minimum required)
    revealDuration: number = 86400  // 24 hours in seconds
  ): Promise<{ proposalId: number; txHash: string }> {
    if (!this.votingContract || !this.signer) {
      await this.initializeContracts();
      if (!this.votingContract || !this.signer) {
        throw new Error('Wallet not connected or voting contract not available');
      }
    }

    try {
      const amountWei = ethers.parseEther(amountRequested);
      
      // Get the current proposal count before creating
      const currentCount = await this.votingContract.proposalCount();
      const expectedProposalId = Number(currentCount) + 1;
      
      console.log('Creating proposal:', {
        title,
        description,
        amountRequested,
        amountWei: amountWei.toString(),
        commitDuration,
        revealDuration,
        currentCount: Number(currentCount),
        expectedProposalId,
        contractAddress: this.VOTING_ADDRESS
      });

      const tx = await this.votingContract.createProposal(
        title,
        description,
        amountWei,
        commitDuration,
        revealDuration
      );
      
      const receipt = await tx.wait();
      
      console.log('Transaction receipt:', receipt);
      console.log('Transaction logs:', receipt.logs);
      
      // Wait a moment for the blockchain state to update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify the proposal was created by checking the new count
      const newCount = await this.votingContract.proposalCount();
      const actualProposalId = Number(newCount);
      
      // Double-check that the proposal exists
      let retries = 0;
      const maxRetries = 5;
      while (retries < maxRetries) {
        try {
          const exists = await this.proposalExists(actualProposalId.toString());
          if (exists) {
            break;
          }
        } catch (error) {
          console.log(`Proposal verification attempt ${retries + 1} failed, retrying...`);
        }
        
        retries++;
        if (retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      console.log('✅ Proposal created successfully:', {
        proposalId: actualProposalId,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        retries
      });

      return {
        proposalId: actualProposalId,
        txHash: tx.hash,
      };
    } catch (error) {
      console.error('Failed to create proposal:', error);
      
      // Provide helpful error messages for common issues
      if (error instanceof Error) {
        if (error.message.includes('Commit duration too short')) {
          throw new Error('Commit duration must be at least 24 hours (86400 seconds). Please use longer durations.');
        } else if (error.message.includes('Reveal duration too short')) {
          throw new Error('Reveal duration must be at least 24 hours (86400 seconds). Please use longer durations.');
        }
      }
      
      throw error;
    }
  }

  // Method to get proposal count
  public async getProposalCount(): Promise<number> {
    if (!this.votingContract) {
      throw new Error('Voting contract not available');
    }

    try {
      const count = await this.votingContract.proposalCount();
      return Number(count);
    } catch (error) {
      console.error('Failed to get proposal count:', error);
      throw error;
    }
  }

  // Method to verify a proposal exists
  public async proposalExists(proposalId: string): Promise<boolean> {
    if (!this.votingContract) {
      throw new Error('Voting contract not available');
    }

    try {
      const proposalIdUint = BigInt(proposalId);
      const [title, description, proposer, amountRequested, commitStartTime, commitEndTime, revealStartTime, revealEndTime, executed, exists] = 
        await this.votingContract.getProposal(proposalIdUint);
      
      console.log('Proposal exists check:', {
        proposalId,
        exists,
        title: title || 'N/A',
        proposer: proposer || 'N/A'
      });
      
      return exists;
    } catch (error) {
      console.error('Failed to check if proposal exists:', error);
      return false;
    }
  }

  // Method to get the latest proposal ID
  public async getLatestProposalId(): Promise<number> {
    try {
      const count = await this.getProposalCount();
      // If count is 0, return 0
      if (count === 0) {
        return 0;
      }
      
      // Try to find the highest valid proposal ID
      // Start from count and work backwards to find the last valid proposal
      for (let i = count; i > 0; i--) {
        try {
          const proposalIdUint = BigInt(i);
          const [title, description, proposer, amountRequested, commitStartTime, commitEndTime, revealStartTime, revealEndTime, executed, exists] =
            await this.votingContract!.getProposal(proposalIdUint);
          
          if (exists) {
            console.log(`✅ Found valid proposal at ID: ${i}`);
            return i;
          }
        } catch (error) {
          console.log(`Proposal ID ${i} not found, trying ${i-1}...`);
          continue;
        }
      }
      
      return 0;
    } catch (error) {
      console.error('Failed to get latest proposal ID:', error);
      return 0;
    }
  }

  // Method to get all valid proposal IDs
  public async getAllValidProposalIds(): Promise<number[]> {
    try {
      if (!this.votingContract) {
        throw new Error('Voting contract not available');
      }

      const count = await this.getProposalCount();
      const validIds: number[] = [];

      for (let i = 1; i <= count; i++) {
        try {
          const proposalIdUint = BigInt(i);
          const [title, description, proposer, amountRequested, commitStartTime, commitEndTime, revealStartTime, revealEndTime, executed, exists] =
            await this.votingContract.getProposal(proposalIdUint);
          
          if (exists) {
            validIds.push(i);
            console.log(`✅ Valid proposal found: ID ${i} - ${title}`);
          }
        } catch (error) {
          console.log(`Proposal ID ${i} not accessible`);
          continue;
        }
      }

      console.log(`📊 Found ${validIds.length} valid proposals: [${validIds.join(', ')}]`);
      return validIds;
    } catch (error) {
      console.error('Failed to get valid proposal IDs:', error);
      return [];
    }
  }

  // Method to check if wallet is connected
  public async isWalletConnected(): Promise<boolean> {
    try {
      if (!window.ethereum) {
        console.log('❌ No wallet detected');
        return false;
      }

      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const isConnected = accounts.length > 0;
      console.log('🔍 Wallet connection status:', { isConnected, accounts: accounts.length });
      return isConnected;
    } catch (error) {
      console.error('Failed to check wallet connection:', error);
      return false;
    }
  }

  // Debug method to test vote status for multiple proposals
  public async debugVoteStatusForAllProposals(): Promise<void> {
    try {
      if (!this.votingContract || !this.signer) {
        await this.initializeContracts();
        if (!this.votingContract || !this.signer) {
          throw new Error('Wallet not connected or voting contract not available');
        }
      }

      const userAddress = await this.signer.getAddress();
      const proposalCount = await this.getProposalCount();
      
      console.log('🔍 DEBUG: Testing vote status for all proposals...');
      console.log('User address:', userAddress);
      console.log('Total proposals:', proposalCount);

      for (let i = 1; i <= proposalCount; i++) {
        try {
          const proposalIdUint = BigInt(i);
          const [hasCommitted, hasRevealed, userVote, commitHash] = 
            await this.votingContract.getUserVoteStatus(proposalIdUint, userAddress);
          
          console.log(`📊 Proposal ${i} vote status:`, {
            proposalId: i,
            hasCommitted,
            hasRevealed,
            userVote,
            commitHash: commitHash || 'null'
          });
        } catch (error) {
          // Only log if it's not the expected "Proposal does not exist" error
          if (!error.message?.includes('Proposal does not exist')) {
            console.log(`❌ Proposal ${i} error:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Debug failed:', error);
    }
  }
}

export const votingService = new VotingService();
export default votingService;
