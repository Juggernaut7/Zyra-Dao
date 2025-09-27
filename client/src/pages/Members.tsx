import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Search, 
  Filter, 
  TrendingUp, 
  Award, 
  Crown,
  Star,
  Shield,
  UserCheck,
  Calendar,
  Activity
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { api } from '../services/api';

interface Member {
  _id: string;
  walletAddress: string;
  username?: string;
  role: 'member' | 'moderator' | 'admin';
  reputation: number;
  votingPower: number;
  joinDate: string;
  lastActiveAt: string;
  stats: {
    proposalsCreated: number;
    proposalsVoted: number;
    proposalsPassed: number;
    totalContribution: number;
  };
  achievements: Array<{
    type: string;
    earnedAt: string;
    description: string;
  }>;
  level: string;
  status: string;
}

interface DAOStats {
  overview: {
    totalMembers: number;
    totalProposals: number;
    activeProposals: number;
    totalVotes: number;
  };
  topContributors: Member[];
  recentMembers: Member[];
}

const Members: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [daoStats, setDaoStats] = useState<DAOStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('reputation');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchMembers();
    fetchDAOStats();
  }, [currentPage, roleFilter, sortBy, searchTerm]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await api.members.getAll({
        page: currentPage,
        limit: 20,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        search: searchTerm || undefined,
        sortBy,
        sortOrder: 'desc'
      });

      setMembers(response.data.data.members);
      setTotalPages(response.data.data.pagination.totalPages);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDAOStats = async () => {
    try {
      const response = await api.members.getDAOStats();
      setDaoStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch DAO stats:', error);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'moderator':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <Users className="w-4 h-4 text-gray-500" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Legendary':
        return 'text-purple-600 bg-purple-100';
      case 'Expert':
        return 'text-red-600 bg-red-100';
      case 'Advanced':
        return 'text-orange-600 bg-orange-100';
      case 'Intermediate':
        return 'text-blue-600 bg-blue-100';
      case 'Beginner':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'text-green-600 bg-green-100';
      case 'Away':
        return 'text-yellow-600 bg-yellow-100';
      case 'Dormant':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-neutral-900 mb-2">
            DAO Members
          </h1>
          <p className="text-neutral-500">
            Connect with contributors and track community engagement
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchMembers} loading={loading}>
          Refresh
        </Button>
      </motion.div>

      {/* Stats Overview */}
      {daoStats && (
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500 mb-1">Total Members</p>
                <p className="text-3xl font-bold text-neutral-900">
                  {daoStats.overview.totalMembers}
                </p>
              </div>
              <div className="p-3 bg-brandBlue-50 rounded-lg">
                <Users className="w-6 h-6 text-brandBlue-500" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500 mb-1">Total Proposals</p>
                <p className="text-3xl font-bold text-neutral-900">
                  {daoStats.overview.totalProposals}
                </p>
              </div>
              <div className="p-3 bg-success/10 rounded-lg">
                <Activity className="w-6 h-6 text-success" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500 mb-1">Active Proposals</p>
                <p className="text-3xl font-bold text-neutral-900">
                  {daoStats.overview.activeProposals}
                </p>
              </div>
              <div className="p-3 bg-warning-500/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-warning-500" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500 mb-1">Total Votes</p>
                <p className="text-3xl font-bold text-neutral-900">
                  {daoStats.overview.totalVotes}
                </p>
              </div>
              <div className="p-3 bg-danger/10 rounded-lg">
                <Award className="w-6 h-6 text-danger" />
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Filters and Search */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Search members by name, address, or bio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-neutral-100 border border-neutral-300 rounded-base focus:outline-none focus:ring-2 focus:ring-brandBlue-100 focus:border-brandBlue-500 transition-all duration-200"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-neutral-500" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-neutral-300 rounded-base focus:outline-none focus:ring-2 focus:ring-brandBlue-100 focus:border-brandBlue-500"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
                <option value="member">Member</option>
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-neutral-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-white border border-neutral-300 rounded-base focus:outline-none focus:ring-2 focus:ring-brandBlue-100 focus:border-brandBlue-500"
              >
                <option value="reputation">Reputation</option>
                <option value="stats.proposalsCreated">Proposals Created</option>
                <option value="stats.proposalsVoted">Votes Cast</option>
                <option value="stats.totalContribution">Contributions</option>
                <option value="joinDate">Join Date</option>
              </select>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Members Grid */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-neutral-200 rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-neutral-200 rounded w-32"></div>
                      <div className="h-3 bg-neutral-200 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-neutral-200 rounded w-20"></div>
                    <div className="h-3 bg-neutral-200 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <motion.div
                  key={member._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-brandBlue-500 rounded-full flex items-center justify-center">
                      <UserCheck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-neutral-900">
                          {member.username || formatAddress(member.walletAddress)}
                        </h3>
                        {getRoleIcon(member.role)}
                      </div>
                      <p className="text-sm text-neutral-500">
                        {formatAddress(member.walletAddress)}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(member.level)}`}>
                          {member.level}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                          {member.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center space-x-2 mb-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="font-semibold text-neutral-900">
                        {member.reputation}
                      </span>
                    </div>
                    <div className="text-sm text-neutral-500 space-y-1">
                      <p>{member.stats.proposalsCreated} proposals</p>
                      <p>{member.stats.proposalsVoted} votes</p>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>Joined {formatDate(member.joinDate)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {members.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">No members found</h3>
                  <p className="text-neutral-500">
                    {searchTerm ? 'Try adjusting your search criteria' : 'No members have joined the DAO yet'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-6">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="px-4 py-2 text-sm text-neutral-500">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default Members;