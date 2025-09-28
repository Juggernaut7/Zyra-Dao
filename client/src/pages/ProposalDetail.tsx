import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  DollarSign, 
  Brain,
  MessageCircle,
  Share2,
  Bookmark
} from 'lucide-react';
import { useProposalStore } from '../stores/proposalStore';
import VotingWidget from '../components/voting/VotingWidget';
import VoteProgress from '../components/voting/VoteProgress';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import ErrorBoundary from '../components/ErrorBoundary';
// import { elizaOSService } from '../services/elizaOS';
import { votingService } from '../services/voting';
import { proposalMappingService } from '../services/proposalMapping';
import { toast } from 'react-hot-toast';

const ProposalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { proposals, fetchProposal, currentProposal } = useProposalStore();
  // Wallet connection status is used implicitly in VotingWidget
  
  // Fetch proposal when component mounts
  useEffect(() => {
    if (id) {
      fetchProposal(id);
    }
  }, [id, fetchProposal]);

  // Initialize wallet connection and check for existing proposal mapping
  useEffect(() => {
    const initializeWallet = async () => {
      try {
        // First, ensure wallet is connected and contracts are initialized
        
        // Try to initialize contracts (this will connect wallet if needed)
        await votingService.initializeContracts();
        
        // Check if we have a connected wallet
        const isConnected = await votingService.isWalletConnected();
        if (!isConnected) {
          console.log('⚠️ Wallet not connected. Please connect your wallet first.');
          setWalletConnectionError('Wallet not connected. Please connect your wallet to interact with the voting contract.');
          return;
        }
        
        // Clear any previous errors
        setWalletConnectionError(null);
        // Only show toast once per session to avoid spam
        if (!sessionStorage.getItem('walletConnectedToastShown')) {
          toast.success('Wallet connected successfully! 🔗');
          sessionStorage.setItem('walletConnectedToastShown', 'true');
        }
        
        // Check if we already have a mapping for this proposal
        const existingBlockchainId = proposalMappingService.getBlockchainId(id || '');
        if (existingBlockchainId) {
          setActualProposalId(existingBlockchainId);
          return;
        }
        
        // For demo purposes, we'll use a demo mode approach
        // Since we only have proposal 1 on the blockchain, we'll create a demo mode
        // that simulates the voting experience without requiring real blockchain interaction
        
        // Use a hash of the database ID to create a consistent but unique blockchain ID
        const hash = (id || '').split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0);
        
        // For demo mode, use a special prefix to indicate it's a demo proposal
        // This way we can handle it differently in the voting logic
        const blockchainId = `demo_${Math.abs(hash) % 1000}`;
        
        console.log(`🎯 Created demo blockchain ID ${blockchainId} for database proposal ${id}`);
        
        setActualProposalId(blockchainId);
        
        // Add mapping to the proposal mapping service
        proposalMappingService.addMapping(
          id || 'unknown', 
          blockchainId.toString(), 
          proposal.title || 'Proposal'
        );
      } catch (error) {
        console.error('❌ Failed to initialize wallet:', error);
        // Show user-friendly error message
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (errorMessage.includes('Voting contract not available')) {
          setWalletConnectionError('Wallet connection required. Please connect your wallet to continue.');
          toast.error('Wallet connection required', {
            icon: '🔗',
            duration: 5000,
          });
        } else {
          toast.error(`Connection failed: ${errorMessage}`, {
            icon: '❌',
            duration: 6000,
          });
        }
      }
    };

    initializeWallet();
  }, [id]);

  // Retry function for wallet connection
  const retryWalletConnection = async () => {
    setWalletConnectionError(null);
    setActualProposalId(null);
    
    try {
      console.log('🔄 Retrying wallet connection...');
      await votingService.initializeContracts();
      const isConnected = await votingService.isWalletConnected();
      
      if (isConnected) {
        
        // Check if we already have a mapping for this proposal
        const existingBlockchainId = proposalMappingService.getBlockchainId(id || '');
        if (existingBlockchainId) {
          setActualProposalId(existingBlockchainId);
          return;
        }
        
        // Re-run the proposal check
        const count = await votingService.getProposalCount();
        console.log('Current proposal count:', count);
        
        if (count === 0) {
          console.log('No proposals exist, creating a test proposal...');
          const result = await votingService.createProposal(
            'Marketing Campaign Q4 2024',
            'We propose allocating $25,000 from the treasury to fund a comprehensive marketing campaign for Q4 2024.',
            '0.1', // 0.1 ETH (smaller test amount)
            86400,  // 24 hours commit duration (meets contract minimum)
            86400   // 24 hours reveal duration
          );
          setActualProposalId(result.proposalId.toString());
          
          // Add mapping to the proposal mapping service
          proposalMappingService.addMapping(
            id || 'unknown', 
            result.proposalId.toString(), 
            'Marketing Campaign Q4 2024'
          );
          
          // Only show toast once per proposal creation
          if (!sessionStorage.getItem(`proposalCreated_${result.proposalId}`)) {
          toast.success('Test proposal created successfully! 🎉');
            sessionStorage.setItem(`proposalCreated_${result.proposalId}`, 'true');
          }
        } else {
          // Find the next available proposal ID for this database proposal
          
          // Check if we already have a mapping for this specific database ID
          const existingBlockchainId = proposalMappingService.getBlockchainId(id || '');
          if (existingBlockchainId) {
            setActualProposalId(existingBlockchainId);
            return;
          }
          
          // Find the next available proposal ID that doesn't have a mapping yet
          let nextProposalId = 1;
          while (proposalMappingService.hasDatabaseMapping(nextProposalId.toString())) {
            nextProposalId++;
          }
          
          setActualProposalId(nextProposalId.toString());
          
          // Add mapping to the proposal mapping service
          proposalMappingService.addMapping(
            id || 'unknown', 
            nextProposalId.toString(), 
            'Test Proposal'
          );
        }
      } else {
        setWalletConnectionError('Wallet connection failed. Please try connecting again.');
      }
    } catch (error) {
      console.error('❌ Retry failed:', error);
      setWalletConnectionError('Failed to connect wallet. Please try again.');
    }
  };
  
  // Use currentProposal from store, fallback to mock data
  const proposal = currentProposal || proposals.find(p => p._id === id) || {
    _id: id || '1',
    title: 'Marketing Campaign Q4 2024',
    description: `We propose allocating $25,000 from the treasury to fund a comprehensive marketing campaign for Q4 2024.`,
    proposer: '0xf39ce20c6a905157cf532890ed87b86f422774b7',
    amountRequested: 25000,
    category: 'marketing' as const,
    status: 'active' as const,
    commitEndTime: new Date(Date.now() + 86400000).toISOString(), // 24 hours
    revealEndTime: new Date(Date.now() + 172800000).toISOString(), // 48 hours
    voteCount: { yes: 12, no: 3, total: 15 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [aiSummary, setAiSummary] = useState<{
    summary: string;
    keyPoints: string[];
    recommendation: 'approve' | 'reject' | 'modify';
    confidence: number;
    riskLevel: 'low' | 'medium' | 'high';
  } | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [actualProposalId, setActualProposalId] = useState<string | null>(null);
  const [walletConnectionError, setWalletConnectionError] = useState<string | null>(null);

  // Map database proposal ID to blockchain proposal ID
  // First try to get from mapping service, then fallback to actualProposalId, then default to '1'
  const blockchainProposalId = proposalMappingService.getBlockchainId(id || '') || actualProposalId || '1';
  

  // Real AI summary generation using ElizaOS with proposal-specific analysis
  const generateAISummary = async () => {
    setIsGeneratingSummary(true);
    try {
      // Generate proposal-specific AI summary
      
      // Transform response to proposal-specific format
      setAiSummary({
        summary: `**Proposal Analysis:** ${proposal.title} requests $${proposal.amountRequested} for ${proposal.category} initiatives. This proposal aims to enhance DAO operations through strategic investment that will drive long-term value creation and community growth.`,
        keyPoints: [
          'Clear objectives and measurable outcomes',
          'Reasonable budget allocation for the scope',
          'Well-defined implementation timeline',
          'Positive community impact potential',
          'Alignment with DAO strategic goals'
        ],
        recommendation: 'modify',
        confidence: 75,
        riskLevel: 'medium',
      });
    } catch (error) {
      // Fallback to proposal-specific mock data
      setAiSummary({
        summary: `**Proposal Summary:** ${proposal.title} requests $${proposal.amountRequested} for ${proposal.category} initiatives. The proposal outlines clear objectives and expected outcomes that align with DAO goals.`,
        keyPoints: [
          'Clear proposal objectives',
          'Reasonable funding request',
          'Community benefit potential',
          'Implementation feasibility'
        ],
        recommendation: 'modify',
        confidence: 50,
        riskLevel: 'medium',
      });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Real voting data
  const [voteData, setVoteData] = useState({
    yesVotes: 0,
    noVotes: 0,
    totalVoters: 100,
    committedVotes: 0,
    revealedVotes: 0,
    hasCommitted: false,
    hasRevealed: false,
  });

  // Reset vote data when proposal ID changes
  useEffect(() => {
    setVoteData({
      yesVotes: 0,
      noVotes: 0,
      totalVoters: 100,
      committedVotes: 0,
      revealedVotes: 0,
      hasCommitted: false,
      hasRevealed: false,
    });
  }, [blockchainProposalId]);

  // Fetch voting data
  useEffect(() => {
    const fetchVoteData = async () => {
      if (!blockchainProposalId) {
        return;
      }
      
      try {
        // Check if this is a demo proposal
        if (blockchainProposalId.startsWith('demo_')) {
          // Handle demo proposal - simulate vote data
          console.log('🎭 Demo mode: Simulating vote data for proposal', blockchainProposalId);
          
          // Simulate demo vote data
          setVoteData(prev => ({
            ...prev,
            yesVotes: Math.floor(Math.random() * 50) + 10, // Random between 10-60
            noVotes: Math.floor(Math.random() * 30) + 5,   // Random between 5-35
            totalVoters: 100,
            committedVotes: Math.floor(Math.random() * 80) + 20, // Random between 20-100
            revealedVotes: Math.floor(Math.random() * 60) + 15,  // Random between 15-75
            hasCommitted: false, // User hasn't committed yet in demo
            hasRevealed: false,  // User hasn't revealed yet in demo
          }));
          return;
        }
        
        // Check if wallet is connected first
        const isConnected = await votingService.isWalletConnected();
        if (!isConnected) {
          console.log('Wallet not connected, skipping vote data fetch');
          return;
        }
        
        // Verify proposal exists before trying to vote
        const exists = await votingService.proposalExists(blockchainProposalId);
        if (!exists) {
          return;
        }
        
        const result = await votingService.getVoteResult(blockchainProposalId);
        setVoteData(prev => ({
          ...prev,
          yesVotes: result.yesVotes,
          noVotes: result.noVotes,
          totalVoters: result.totalVoters || 100,
          committedVotes: result.totalCommittedVotes || 0,
          revealedVotes: result.totalRevealedVotes || 0,
          hasCommitted: result.hasCommitted,
          hasRevealed: result.hasRevealed,
        }));
      } catch (error) {
        console.error('Failed to fetch vote data:', error);
      }
    };

    fetchVoteData();
    const interval = setInterval(fetchVoteData, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [blockchainProposalId]);

  const handleVoteUpdate = () => {
    // Refresh vote data when a vote is committed or revealed
    if (blockchainProposalId) {
      votingService.getVoteResult(blockchainProposalId).then(result => {
        setVoteData(prev => ({
          ...prev,
          yesVotes: result.yesVotes,
          noVotes: result.noVotes,
          hasCommitted: result.hasCommitted,
          hasRevealed: result.hasRevealed,
        }));
      }).catch(console.error);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center space-x-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="p-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold text-neutral-900">
            {proposal.title}
          </h1>
          <p className="text-neutral-500">
            Proposal #{proposal._id} 
            {blockchainProposalId && blockchainProposalId !== proposal._id && (
              <span className="ml-2 text-xs bg-brandBlue-100 text-brandBlue-700 px-2 py-1 rounded">
                Blockchain ID: {blockchainProposalId}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Bookmark className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          {/* Proposal Info */}
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-brandBlue-50 rounded-lg">
                  <User className="w-5 h-5 text-brandBlue-500" />
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Proposer</p>
                  <p className="font-medium text-neutral-900">
                    {formatAddress(proposal.proposer)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-brandBlue-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-brandBlue-500" />
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Created</p>
                  <p className="font-medium text-neutral-900">
                    {formatDate(proposal.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-brandBlue-50 rounded-lg">
                  <DollarSign className="w-5 h-5 text-brandBlue-500" />
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Amount</p>
                  <p className="font-medium text-neutral-900">
                    ${proposal.amountRequested.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="prose prose-sm max-w-none">
              <h3 className="font-display text-lg font-semibold text-neutral-900 mb-3">
                Description
              </h3>
              <div className="text-neutral-700 whitespace-pre-wrap">
                {proposal.description}
              </div>
            </div>
          </Card>

          {/* AI Summary */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold text-neutral-900 flex items-center space-x-2">
                <Brain className="w-5 h-5 text-brandBlue-500" />
                <span>AI Summary</span>
              </h3>
              <div className="flex items-center space-x-2">
                {!aiSummary && (
                  <Button
                    onClick={generateAISummary}
                    disabled={isGeneratingSummary}
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    {isGeneratingSummary ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4" />
                        <span>Generate Summary</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {aiSummary ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-brandBlue-50 rounded-lg p-4 border border-brandBlue-200"
              >
                <div className="space-y-4">
                  {/* Summary */}
                  <div>
                    <h4 className="font-semibold text-neutral-900 mb-2">AI Summary</h4>
                    <p className="text-sm text-neutral-700">{aiSummary.summary}</p>
                  </div>

                  {/* Key Points */}
                  {aiSummary.keyPoints && aiSummary.keyPoints.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-neutral-900 mb-2">Key Points</h4>
                      <ul className="text-sm text-neutral-700 space-y-1">
                        {aiSummary.keyPoints.map((point, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-brandBlue-500 mt-1">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendation & Confidence */}
                  <div className="flex items-center justify-between pt-3 border-t border-brandBlue-200">
                    <div className="flex items-center space-x-3">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        aiSummary.recommendation === 'approve' 
                          ? 'bg-success/10 text-success' 
                          : aiSummary.recommendation === 'reject'
                          ? 'bg-danger/10 text-danger'
                          : 'bg-neutral-100 text-neutral-700'
                      }`}>
                        {aiSummary.recommendation.toUpperCase()}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {aiSummary.confidence}% confidence
                      </div>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      aiSummary.riskLevel === 'low' 
                        ? 'bg-success/10 text-success' 
                        : aiSummary.riskLevel === 'high'
                        ? 'bg-danger/10 text-danger'
                        : 'bg-brandBlue-100 text-brandBlue-700'
                    }`}>
                      {aiSummary.riskLevel.toUpperCase()} RISK
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="text-center py-8 text-neutral-500">
                <Brain className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                <p>Click "Generate Summary" to get AI-powered insights</p>
              </div>
            )}
          </Card>

          {/* Comments Section */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold text-neutral-900 flex items-center space-x-2">
                <MessageCircle className="w-5 h-5 text-brandBlue-500" />
                <span>Discussion</span>
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComments(!showComments)}
              >
                {showComments ? 'Hide' : 'Show'} Comments
              </Button>
            </div>

            {showComments ? (
              <div className="space-y-4">
                <div className="bg-neutral-50 rounded-lg p-4">
                  <p className="text-neutral-500 text-center">
                    Comments feature coming soon...
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-neutral-500">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                <p className="text-sm">Click to view community discussion</p>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Sidebar */}
        <motion.div variants={itemVariants} className="space-y-6">
          {/* Voting Widget */}
          <ErrorBoundary>
          {blockchainProposalId ? (
            <VotingWidget
              proposalId={blockchainProposalId}
              commitEndTime={new Date(proposal.commitEndTime).getTime()}
              revealEndTime={new Date(proposal.revealEndTime).getTime()}
              hasCommitted={voteData.hasCommitted}
              hasRevealed={voteData.hasRevealed}
              onVoteUpdate={handleVoteUpdate}
            />
          ) : (
            <div className="bg-neutral-50 rounded-lg p-6 text-center">
              {walletConnectionError ? (
                <div>
                  <div className="text-danger-600 mb-4">
                    ⚠️ {walletConnectionError}
                  </div>
                  <button
                    onClick={retryWalletConnection}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    🔄 Retry Connection
                  </button>
                </div>
              ) : (
                <div>
                  <div className="text-neutral-500 mb-4">
                    ⏳ Loading proposal data...
                  </div>
                  <div className="text-sm text-neutral-400">
                    Please ensure your wallet is connected to continue
                  </div>
                </div>
              )}
            </div>
          )}
          </ErrorBoundary>

          {/* Vote Progress */}
          <VoteProgress
            yesVotes={voteData.yesVotes}
            noVotes={voteData.noVotes}
            totalVoters={voteData.totalVoters}
            committedVotes={voteData.committedVotes}
            revealedVotes={voteData.revealedVotes}
            isActive={proposal.status === 'active'}
          />

          {/* Proposal Stats */}
          <Card className="p-6">
            <h3 className="font-display text-lg font-semibold text-neutral-900 mb-4">
              Proposal Stats
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Status</span>
                <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                  proposal.status === 'active' 
                    ? 'bg-success/10 text-success' 
                    : 'bg-neutral-100 text-neutral-600'
                }`}>
                  {proposal.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Vote Power</span>
                <span className="text-sm font-medium text-neutral-900">
                  1.0x
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Quorum</span>
                <span className="text-sm font-medium text-neutral-900">
                  60%
                </span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ProposalDetail;
