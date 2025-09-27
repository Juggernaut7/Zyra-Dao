import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Users, Clock, Lock, Eye } from 'lucide-react';

interface VoteProgressProps {
  yesVotes: number;
  noVotes: number;
  totalVoters: number;
  committedVotes: number;
  revealedVotes: number;
  isActive: boolean;
}

const VoteProgress: React.FC<VoteProgressProps> = ({
  yesVotes,
  noVotes,
  totalVoters,
  committedVotes,
  revealedVotes,
  isActive
}) => {
  const totalVotes = yesVotes + noVotes;
  const yesPercentage = totalVotes > 0 ? (yesVotes / totalVotes) * 100 : 0;
  const noPercentage = totalVotes > 0 ? (noVotes / totalVotes) * 100 : 0;
  const committedPercentage = (committedVotes / totalVoters) * 100;
  const revealedPercentage = (revealedVotes / totalVoters) * 100;

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  const progressVariants = {
    hidden: { width: 0 },
    visible: (percentage: number) => ({
      width: `${percentage}%`,
      transition: {
        duration: 1.5,
        ease: [0.25, 0.1, 0.25, 1]
      }
    })
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="bg-white rounded-lg border border-neutral-300 p-6 space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-neutral-900">
          Voting Progress
        </h3>
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
          isActive 
            ? 'bg-success/10 text-success' 
            : 'bg-neutral-100 text-neutral-600'
        }`}>
          <Clock className="w-3 h-3" />
          <span>{isActive ? 'Active' : 'Ended'}</span>
        </div>
      </motion.div>

      {/* Participation Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
        <div className="bg-neutral-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-brandBlue-500" />
              <span className="text-sm font-medium text-neutral-700">Committed</span>
            </div>
            <span className="text-sm font-semibold text-neutral-900">
              {committedVotes}/{totalVoters}
            </span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2">
            <motion.div
              className="bg-brandBlue-500 h-2 rounded-full"
              variants={progressVariants}
              initial="hidden"
              animate="visible"
              custom={committedPercentage}
            />
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            {committedPercentage.toFixed(1)}% participation
          </p>
        </div>

        <div className="bg-neutral-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-success" />
              <span className="text-sm font-medium text-neutral-700">Revealed</span>
            </div>
            <span className="text-sm font-semibold text-neutral-900">
              {revealedVotes}/{totalVoters}
            </span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2">
            <motion.div
              className="bg-success h-2 rounded-full"
              variants={progressVariants}
              initial="hidden"
              animate="visible"
              custom={revealedPercentage}
            />
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            {revealedPercentage.toFixed(1)}% revealed
          </p>
        </div>
      </motion.div>

      {/* Vote Results */}
      {totalVotes > 0 && (
        <motion.div variants={itemVariants} className="space-y-4">
          <h4 className="font-medium text-neutral-900">Vote Results</h4>
          
          {/* Yes Votes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span className="text-sm font-medium text-neutral-700">Yes</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-neutral-900">
                  {yesVotes} votes
                </span>
                <span className="text-xs text-neutral-500 ml-2">
                  ({yesPercentage.toFixed(1)}%)
                </span>
              </div>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-3">
              <motion.div
                className="bg-success h-3 rounded-full"
                variants={progressVariants}
                initial="hidden"
                animate="visible"
                custom={yesPercentage}
              />
            </div>
          </div>

          {/* No Votes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <XCircle className="w-4 h-4 text-danger" />
                <span className="text-sm font-medium text-neutral-700">No</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-neutral-900">
                  {noVotes} votes
                </span>
                <span className="text-xs text-neutral-500 ml-2">
                  ({noPercentage.toFixed(1)}%)
                </span>
              </div>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-3">
              <motion.div
                className="bg-danger h-3 rounded-full"
                variants={progressVariants}
                initial="hidden"
                animate="visible"
                custom={noPercentage}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Voter Participation */}
      <motion.div variants={itemVariants} className="pt-4 border-t border-neutral-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-neutral-500" />
            <span className="text-sm text-neutral-600">Total Voters</span>
          </div>
          <span className="text-sm font-semibold text-neutral-900">{totalVoters}</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default VoteProgress;
