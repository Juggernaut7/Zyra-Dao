import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, 
  Eye, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Hash,
  ExternalLink
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useWalletStore } from '../../stores/walletStore';
import { votingService } from '../../services/voting';

interface VotingWidgetProps {
  proposalId: string;
  commitEndTime: number;
  revealEndTime: number;
  hasCommitted: boolean;
  hasRevealed: boolean;
  onVoteUpdate?: () => void;
}

type VotingPhase = 'commit' | 'reveal' | 'ended';

const VotingWidget: React.FC<VotingWidgetProps> = ({
  proposalId,
  commitEndTime,
  revealEndTime,
  hasCommitted,
  hasRevealed,
  onVoteUpdate
}) => {
  const { isConnected } = useWalletStore();
  const [selectedVote, setSelectedVote] = useState<'yes' | 'no' | null>(null);
  const [salt, setSalt] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [phase, setPhase] = useState<VotingPhase>('commit');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Generate random salt if not provided
  useEffect(() => {
    if (!salt) {
      try {
        setSalt(votingService.generateSalt());
      } catch (error) {
        console.error('Failed to generate salt:', error);
        // Fallback salt generation
        setSalt(Math.random().toString(36).substring(2) + Date.now().toString(36));
      }
    }
  }, [salt]);

  // Calculate time left and current phase
  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      let targetTime = 0;
      let currentPhase: VotingPhase = 'ended';

      // Debug logging (remove in production)
      // console.log('VotingWidget Debug:', {
      //   now, commitEndTime, revealEndTime, hasCommitted, hasRevealed,
      //   timeInCommit: now < commitEndTime,
      //   timeInReveal: now >= commitEndTime && now < revealEndTime
      // });

      // Determine phase based on time and user's voting status
      if (now < commitEndTime) {
        // Still in commit phase
        targetTime = commitEndTime;
        currentPhase = 'commit';
      } else if (now < revealEndTime) {
        // In reveal phase
        targetTime = revealEndTime;
        currentPhase = 'reveal';
      } else {
        // Voting has ended
        currentPhase = 'ended';
      }

      // console.log('Setting phase to:', currentPhase);
      setPhase(currentPhase);

      if (targetTime > 0) {
        const diff = targetTime - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setTimeLeft({ hours, minutes, seconds });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [commitEndTime, revealEndTime, hasCommitted]);

  const handleCommit = async () => {
    if (!selectedVote || !isConnected) return;
    
    setIsCommitting(true);
    setError(null);
    try {
      if (!proposalId) {
        throw new Error('Invalid proposal ID');
      }
      
      // Verify proposal exists before attempting to vote
      const exists = await votingService.proposalExists(proposalId);
      if (!exists) {
        throw new Error(`Proposal ${proposalId} does not exist on the blockchain. Please check the proposal ID.`);
      }
      
      const result = await votingService.commitVote(
        proposalId,
        selectedVote === 'yes',
        salt
      );
      setTxHash(result.txHash);
      toast.success('Vote committed successfully! 🗳️', {
        icon: '✅',
        duration: 4000,
      });
      onVoteUpdate?.();
    } catch (err: any) {
      console.error('Commit vote error:', err);
      
      // Handle specific error cases
      if (err.message?.includes('Proposal does not exist')) {
        toast.error('Proposal not found on blockchain', {
          icon: '❌',
          duration: 5000,
        });
        setError(`Proposal ${proposalId} does not exist on the blockchain. This may be a database proposal that hasn't been created on-chain yet.`);
      } else if (err.message?.includes('Already voted')) {
        toast.error('You have already voted on this proposal', {
          icon: '⚠️',
          duration: 5000,
        });
        setError('You have already committed your vote for this proposal.');
      } else if (err.message?.includes('Commit phase has ended')) {
        toast.error('Commit phase has ended', {
          icon: '⏰',
          duration: 5000,
        });
        setError('The commit phase for this proposal has ended.');
      } else {
        toast.error('Failed to commit vote', {
          icon: '❌',
          duration: 5000,
        });
        setError(err.message || 'Failed to commit vote. Please check your wallet connection.');
      }
    } finally {
      setIsCommitting(false);
    }
  };

  const handleReveal = async () => {
    if (!isConnected) return;
    
    setIsRevealing(true);
    setError(null);
    try {
      if (!proposalId) {
        throw new Error('Invalid proposal ID');
      }
      
      // Verify proposal exists before attempting to reveal
      const exists = await votingService.proposalExists(proposalId);
      if (!exists) {
        throw new Error(`Proposal ${proposalId} does not exist on the blockchain. Please check the proposal ID.`);
      }
      
      const result = await votingService.revealVote(proposalId);
      setTxHash(result.txHash);
      toast.success('Vote revealed successfully! 🔓', {
        icon: '🎉',
        duration: 4000,
      });
      onVoteUpdate?.();
    } catch (err: any) {
      console.error('Reveal vote error:', err);
      
      // Handle specific error cases
      if (err.message?.includes('Proposal does not exist')) {
        toast.error('Proposal not found on blockchain', {
          icon: '❌',
          duration: 5000,
        });
        setError(`Proposal ${proposalId} does not exist on the blockchain. This may be a database proposal that hasn't been created on-chain yet.`);
      } else if (err.message?.includes('Already revealed')) {
        toast.error('You have already revealed your vote', {
          icon: '⚠️',
          duration: 5000,
        });
        setError('You have already revealed your vote for this proposal.');
      } else if (err.message?.includes('Reveal phase has ended')) {
        toast.error('Reveal phase has ended', {
          icon: '⏰',
          duration: 5000,
        });
        setError('The reveal phase for this proposal has ended.');
      } else {
        toast.error('Failed to reveal vote', {
          icon: '❌',
          duration: 5000,
        });
        setError(err.message || 'Failed to reveal vote. Please check your wallet connection.');
      }
    } finally {
      setIsRevealing(false);
    }
  };

  const formatTime = (time: { hours: number; minutes: number; seconds: number }) => {
    return `${time.hours.toString().padStart(2, '0')}:${time.minutes.toString().padStart(2, '0')}:${time.seconds.toString().padStart(2, '0')}`;
  };

  const getPhaseInfo = () => {
    switch (phase) {
      case 'commit':
        return {
          icon: Lock,
          title: hasCommitted ? 'Commit Phase - Vote Committed' : 'Commit Phase',
          description: hasCommitted ? 'Your vote has been committed' : 'Cast your vote anonymously',
          color: 'brandBlue',
          actionText: hasCommitted ? 'Vote Committed' : 'Commit Vote'
        };
      case 'reveal':
        return {
          icon: Eye,
          title: 'Reveal Phase',
          description: hasCommitted 
            ? (hasRevealed ? 'Your vote has been revealed' : 'Reveal your committed vote')
            : 'You must commit a vote first',
          color: 'success',
          actionText: hasCommitted 
            ? (hasRevealed ? 'Vote Revealed' : 'Reveal Vote')
            : 'Commit Vote First'
        };
      case 'ended':
        return {
          icon: CheckCircle,
          title: 'Voting Ended',
          description: 'View final results',
          color: 'neutral',
          actionText: 'View Results'
        };
    }
  };

  const phaseInfo = getPhaseInfo();
  const PhaseIcon = phaseInfo.icon;

  if (!isConnected) {
    return (
      <div className="bg-neutral-50 rounded-lg p-6 text-center">
        <AlertCircle className="w-8 h-8 text-neutral-400 mx-auto mb-3" />
        <h3 className="font-semibold text-neutral-900 mb-2">Connect Wallet to Vote</h3>
        <p className="text-neutral-500 text-sm">
          You need to connect your wallet to participate in voting
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border border-neutral-300 overflow-hidden"
    >
      {/* Header */}
      <div className={`p-4 bg-${phaseInfo.color}-50 border-b border-${phaseInfo.color}-200`}>
        <div className="flex items-center space-x-3">
          <div className={`p-2 bg-${phaseInfo.color}-500 rounded-lg`}>
            <PhaseIcon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-neutral-900">{phaseInfo.title}</h3>
            <p className="text-sm text-neutral-600">{phaseInfo.description}</p>
          </div>
        </div>
      </div>

      {/* Timer */}
      <div className="p-4 bg-neutral-50 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-neutral-500" />
            <span className="text-sm text-neutral-600">
              {phase === 'ended' ? 'Voting has ended' : `${formatTime(timeLeft)} remaining`}
            </span>
          </div>
          <div className="text-xs text-neutral-500">
            {phase === 'commit' ? 'Commit Phase' : phase === 'reveal' ? 'Reveal Phase' : 'Ended'}
          </div>
        </div>
        {/* Debug info - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-2 text-xs text-neutral-400">
            Debug: Phase={phase}, HasCommitted={hasCommitted ? 'Yes' : 'No'}, HasRevealed={hasRevealed ? 'Yes' : 'No'}
          </div>
        )}
      </div>

      {/* Vote Selection */}
      <AnimatePresence>
        {(phase === 'commit' || phase === 'reveal') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 space-y-4"
          >
            {/* Vote Options */}
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                onClick={() => setSelectedVote('yes')}
                className={`p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-center space-x-2 ${
                  selectedVote === 'yes'
                    ? 'border-success bg-success/10 text-success'
                    : 'border-neutral-200 hover:border-success/50 text-neutral-700'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Yes</span>
              </motion.button>

              <motion.button
                onClick={() => setSelectedVote('no')}
                className={`p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-center space-x-2 ${
                  selectedVote === 'no'
                    ? 'border-danger bg-danger/10 text-danger'
                    : 'border-neutral-200 hover:border-danger/50 text-neutral-700'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <XCircle className="w-5 h-5" />
                <span className="font-medium">No</span>
              </motion.button>
            </div>

            {/* Salt Display */}
            <div className="bg-neutral-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Hash className="w-4 h-4 text-neutral-500" />
                <span className="text-sm font-medium text-neutral-700">Vote Salt</span>
              </div>
              <div className="font-mono text-xs text-neutral-600 bg-white p-2 rounded border">
                {salt}
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Keep this salt safe - you'll need it to reveal your vote
              </p>
            </div>

            {/* Action Button */}
            <motion.button
              onClick={(!hasCommitted || phase === 'commit') ? handleCommit : handleReveal}
              disabled={!selectedVote || (phase === 'commit' || !hasCommitted ? isCommitting : isRevealing)}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                selectedVote
                  ? 'bg-brandBlue-500 hover:bg-brandBlue-700 text-white'
                  : 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
              }`}
              whileHover={selectedVote ? { scale: 1.02 } : {}}
              whileTap={selectedVote ? { scale: 0.98 } : {}}
            >
              {(phase === 'commit' || !hasCommitted) ? (
                isCommitting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    <span>Committing...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Commit Vote</span>
                  </>
                )
              ) : (
                isRevealing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    <span>Revealing...</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    <span>Reveal Vote</span>
                  </>
                )
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-danger/10 border-t border-danger/20">
          <div className="flex items-center space-x-2 text-danger">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Transaction Hash Display */}
      {txHash && (
        <div className="p-4 bg-success/10 border-t border-success/20">
          <div className="flex items-center space-x-2 text-success">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Transaction successful!</span>
          </div>
          <div className="mt-2 flex items-center space-x-2">
            <span className="text-xs text-neutral-600">Hash:</span>
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brandBlue-500 hover:text-brandBlue-700 font-mono flex items-center space-x-1"
            >
              <span>{txHash.slice(0, 10)}...</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Status Display */}
      <div className="p-4 bg-neutral-50 border-t border-neutral-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-1 ${
              hasCommitted ? 'text-success' : 'text-neutral-400'
            }`}>
              <Lock className="w-4 h-4" />
              <span>Committed</span>
            </div>
            <div className={`flex items-center space-x-1 ${
              hasRevealed ? 'text-success' : 'text-neutral-400'
            }`}>
              <Eye className="w-4 h-4" />
              <span>Revealed</span>
            </div>
          </div>
          
          {phase === 'ended' && (
            <motion.button
              onClick={() => window.open(`https://sepolia.etherscan.io/address/${import.meta.env.VITE_CONTRACT_VOTING}`, '_blank')}
              className="text-brandBlue-500 hover:text-brandBlue-700 font-medium flex items-center space-x-1"
              whileHover={{ scale: 1.05 }}
            >
              <span>View Contract</span>
              <ExternalLink className="w-3 h-3" />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default VotingWidget;
