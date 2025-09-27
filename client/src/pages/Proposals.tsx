import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Filter, 
  Search,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Lock,
  Eye,
  RefreshCw
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import CreateProposalModal from '../components/modals/CreateProposalModal';
import { useProposalStore } from '../stores/proposalStore';
import { votingService } from '../services/voting';
import { toast } from 'react-hot-toast';

const Proposals: React.FC = () => {
  const { proposals, fetchProposals, loading, error } = useProposalStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'failed'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [proposalVoteData, setProposalVoteData] = useState<Record<string, {
    yesVotes: number;
    noVotes: number;
    committedVotes: number;
    revealedVotes: number;
    hasCommitted: boolean;
    hasRevealed: boolean;
  }>>({});

  // Fetch proposals on component mount
  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  // Fetch vote data for all proposals
  useEffect(() => {
    const fetchVoteDataForProposals = async () => {
      try {
        await votingService.initializeContracts();
        const isConnected = await votingService.isWalletConnected();
        
        if (!isConnected) {
          console.log('Wallet not connected, skipping vote data fetch');
          return;
        }

        const proposalCount = await votingService.getProposalCount();
        console.log('📊 Fetching vote data for', proposalCount, 'proposals');
        
        const voteDataMap: Record<string, any> = {};
        
        // Fetch vote data for each proposal
        for (let i = 1; i <= proposalCount; i++) {
          try {
            const exists = await votingService.proposalExists(i.toString());
            if (exists) {
              const voteResult = await votingService.getVoteResult(i.toString());
              voteDataMap[i.toString()] = {
                yesVotes: voteResult.yesVotes,
                noVotes: voteResult.noVotes,
                committedVotes: voteResult.totalCommittedVotes,
                revealedVotes: voteResult.totalRevealedVotes,
                hasCommitted: voteResult.hasCommitted,
                hasRevealed: voteResult.hasRevealed,
              };
              console.log(`✅ Vote data for proposal ${i}:`, voteResult);
            }
          } catch (error) {
            console.log(`❌ Failed to fetch vote data for proposal ${i}:`, error);
          }
        }
        
        setProposalVoteData(voteDataMap);
        console.log('✅ Vote data loaded for', Object.keys(voteDataMap).length, 'proposals');
        // Only show toast if we actually loaded vote data
        if (Object.keys(voteDataMap).length > 0) {
          toast.success(`Vote data loaded for ${Object.keys(voteDataMap).length} proposals! 📊`, {
            duration: 3000,
          });
        }
      } catch (error) {
        console.error('Failed to fetch vote data:', error);
        toast.error('Failed to load voting data', {
          icon: '❌',
          duration: 4000,
        });
      }
    };

    fetchVoteDataForProposals();
  }, [proposals]); // Re-fetch when proposals change

  // Filter proposals based on search and status
  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch = proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         proposal.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || proposal.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleRefresh = async () => {
    fetchProposals();
    // Also refresh vote data
    try {
      await votingService.initializeContracts();
      const isConnected = await votingService.isWalletConnected();
      
      if (isConnected) {
        const proposalCount = await votingService.getProposalCount();
        const voteDataMap: Record<string, any> = {};
        
        for (let i = 1; i <= proposalCount; i++) {
          try {
            const exists = await votingService.proposalExists(i.toString());
            if (exists) {
              const voteResult = await votingService.getVoteResult(i.toString());
              voteDataMap[i.toString()] = {
                yesVotes: voteResult.yesVotes,
                noVotes: voteResult.noVotes,
                committedVotes: voteResult.totalCommittedVotes,
                revealedVotes: voteResult.totalRevealedVotes,
                hasCommitted: voteResult.hasCommitted,
                hasRevealed: voteResult.hasRevealed,
              };
            }
          } catch (error) {
            console.log(`Failed to fetch vote data for proposal ${i}:`, error);
          }
        }
        
        setProposalVoteData(voteDataMap);
        toast.success('Vote data refreshed! 🔄');
      }
    } catch (error) {
      console.error('Failed to refresh vote data:', error);
      toast.error('Failed to refresh vote data', {
        icon: '❌',
        duration: 4000,
      });
    }
  };

  const handleProposalClick = (proposalId: string) => {
    navigate(`/proposals/${proposalId}`);
  };

  // Mock proposals data (fallback) - commented out for now
  /*
  const mockProposals = [
    {
      id: '1',
      title: 'Marketing Campaign Q4 2024',
      description: 'Allocate $25,000 for comprehensive marketing campaign including social media, content creation, and community events.',
      amountRequested: 25000,
      proposer: '0x1234...5678',
      status: 'active' as const,
      commitEndTs: Date.now() + 86400000, // 24 hours
      revealEndTs: Date.now() + 172800000, // 48 hours
      commitCount: 15,
      revealCount: 8,
      yesVotes: 12,
      noVotes: 3,
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Developer Infrastructure Upgrade',
      description: 'Upgrade server infrastructure and development tools to improve efficiency and security.',
      amountRequested: 85000,
      proposer: '0x8765...4321',
      status: 'completed' as const,
      commitEndTs: Date.now() - 86400000,
      revealEndTs: Date.now() - 43200000,
      commitCount: 28,
      revealCount: 28,
      yesVotes: 24,
      noVotes: 4,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: '3',
      title: 'Community Grant Program',
      description: 'Establish a $50,000 grant program to support community initiatives and small projects.',
      amountRequested: 50000,
      proposer: '0xabcd...efgh',
      status: 'active' as const,
      commitEndTs: Date.now() + 43200000, // 12 hours
      revealEndTs: Date.now() + 129600000, // 36 hours
      commitCount: 22,
      revealCount: 5,
      yesVotes: 18,
      noVotes: 2,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];
  */


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="w-4 h-4" />;
      case 'draft':
        return <FileText className="w-4 h-4" />;
      case 'committed':
        return <Lock className="w-4 h-4" />;
      case 'revealed':
        return <Eye className="w-4 h-4" />;
      case 'executed':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-brandBlue-50 text-brandBlue-700 border-brandBlue-200';
      case 'draft':
        return 'bg-neutral-100 text-neutral-700 border-neutral-200';
      case 'committed':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'revealed':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'executed':
        return 'bg-success/10 text-success border-success/20';
      case 'rejected':
        return 'bg-danger/10 text-danger border-danger/20';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
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
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-neutral-900 mb-2">
            Proposals
          </h1>
          <p className="text-neutral-500">
            Review and vote on DAO proposals using privacy-first commit-reveal voting.
          </p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="secondary"
            onClick={handleRefresh}
            loading={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            variant="primary" 
            className="flex items-center space-x-2"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4" />
            <span>New Proposal</span>
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants}>
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="Search proposals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-neutral-100 border border-neutral-300 rounded-base focus:outline-none focus:ring-2 focus:ring-brandBlue-100 focus:border-brandBlue-500 transition-all duration-200"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-neutral-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 bg-white border border-neutral-300 rounded-base focus:outline-none focus:ring-2 focus:ring-brandBlue-100 focus:border-brandBlue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Error Display */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-danger/10 border border-danger/20 rounded-lg p-4 mb-4"
        >
          <p className="text-danger text-sm">{error}</p>
        </motion.div>
      )}

      {/* Proposals List */}
      <motion.div variants={itemVariants} className="space-y-4">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg border border-neutral-300 p-6"
            >
              <div className="animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="h-6 bg-neutral-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-8 bg-neutral-200 rounded w-20"></div>
                </div>
                <div className="h-4 bg-neutral-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-neutral-200 rounded w-2/3"></div>
              </div>
            </motion.div>
          ))
        ) : (
          filteredProposals.map((proposal, index) => (
          <motion.div
            key={proposal._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hover onClick={() => handleProposalClick(proposal._id)} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-display text-lg font-semibold text-neutral-900 mb-2">
                    {proposal.title}
                  </h3>
                  <p className="text-neutral-600 mb-3 line-clamp-2">
                    {proposal.description}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-neutral-500">
                    <span>Proposed by {proposal.proposer}</span>
                    <span>•</span>
                    <span>{new Date(proposal.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end space-y-2">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(proposal.status)}`}>
                    {getStatusIcon(proposal.status)}
                    <span className="ml-1 capitalize">{proposal.status}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-neutral-900">
                      ${proposal.amountRequested.toLocaleString()}
                    </p>
                    <p className="text-xs text-neutral-500">Amount Requested</p>
                  </div>
                </div>
              </div>

              {/* Voting Progress */}
              {proposal.status === 'active' && (
                <div className="border-t border-neutral-200 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-neutral-700">Voting Progress</span>
                    <span className="text-sm text-neutral-500">
                      {(() => {
                        const voteData = proposalVoteData[proposal._id] || proposalVoteData[index.toString()];
                        if (voteData) {
                          return `${voteData.revealedVotes}/${voteData.committedVotes} votes revealed`;
                        }
                        return `${proposal.voteCount?.total || 0} votes revealed`;
                      })()}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs text-neutral-500 mb-1">
                        {(() => {
                          const voteData = proposalVoteData[proposal._id] || proposalVoteData[index.toString()];
                          if (voteData) {
                            return (
                              <>
                                <span>Yes: {voteData.yesVotes || 0}</span>
                                <span>No: {voteData.noVotes || 0}</span>
                              </>
                            );
                          }
                          return (
                            <>
                                <span>Yes: {proposal.voteCount?.yes || 0}</span>
                                <span>No: {proposal.voteCount?.no || 0}</span>
                            </>
                          );
                        })()}
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-2">
                        <motion.div
                          className="bg-brandBlue-500 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ 
                            width: `${(() => {
                              const voteData = proposalVoteData[proposal._id] || proposalVoteData[index.toString()];
                              if (voteData && (voteData.yesVotes + voteData.noVotes) > 0) {
                                return (voteData.yesVotes / (voteData.yesVotes + voteData.noVotes)) * 100;
                              }
                              const totalVotes = (proposal.voteCount?.yes || 0) + (proposal.voteCount?.no || 0);
                              return totalVotes > 0 ? ((proposal.voteCount?.yes || 0) / totalVotes) * 100 : 0;
                            })()}%` 
                          }}
                          transition={{ duration: 0.8, delay: index * 0.1 }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      {(() => {
                        const voteData = proposalVoteData[proposal._id] || proposalVoteData[index.toString()];
                        const hasCommitted = voteData?.hasCommitted;
                        const hasRevealed = voteData?.hasRevealed;
                        
                        return (
                          <Button 
                            size="sm" 
                            variant={hasCommitted ? "secondary" : "primary"}
                            className={`flex items-center space-x-1 ${hasCommitted ? 'opacity-75' : ''}`}
                            onClick={() => {
                              handleProposalClick(proposal._id);
                            }}
                          >
                            {hasCommitted ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                <span>{hasRevealed ? 'Voted' : 'Committed'}</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3" />
                                <span>Vote</span>
                              </>
                            )}
                          </Button>
                        );
                      })()}
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="flex items-center space-x-1"
                        onClick={() => {
                          handleProposalClick(proposal._id);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
          ))
        )}
      </motion.div>

      {!loading && filteredProposals.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="text-neutral-400 mb-4">
            <FileText className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="font-display text-lg font-semibold text-neutral-700 mb-2">
            No proposals found
          </h3>
          <p className="text-neutral-500 mb-6">
            {searchQuery || filterStatus !== 'all' 
              ? 'Try adjusting your search or filter criteria.' 
              : 'Be the first to create a proposal for the DAO.'
            }
          </p>
          <Button 
            variant="primary"
            onClick={() => setShowCreateModal(true)}
          >
            Create Proposal
          </Button>
        </motion.div>
      )}

      {/* Create Proposal Modal */}
      <CreateProposalModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </motion.div>
  );
};

export default Proposals;
