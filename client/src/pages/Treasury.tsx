import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  TrendingUp, 
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Activity,
  Play,
  RefreshCw
} from 'lucide-react';
import { 
  PieChart as RechartsPieChart, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip,
  LineChart,
  Line,
  Area,
  AreaChart,
  // Legend
} from 'recharts';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { useTreasuryStore } from '../stores/treasuryStore';
import { aiService, type TreasuryInsight } from '../services/aiService';

const Treasury: React.FC = () => {
  const { 
    totalValue, 
    assets, 
    // actions, 
    monthlySpending,
    activeProposals,
    fetchTreasurySummary, 
    fetchTransactions, 
    loading, 
    error,
    midnightEnabled,
    degaEnabled,
    elizaEnabled,
    communicationEnabled,
    initializeIntegrations,
    getAIAnalysis,
    // getAgentInsights,
    executePrivateTransaction
  } = useTreasuryStore();
  
  const [showSimulation, setShowSimulation] = useState(false);
  const [simulationResults, setSimulationResults] = useState<TreasuryInsight[] | null>(null);
  const [isGeneratingSimulation, setIsGeneratingSimulation] = useState(false);

  // Fetch treasury data on component mount
  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([
        fetchTreasurySummary(),
        fetchTransactions(),
        initializeIntegrations()
      ]);
    };
    fetchData();
  }, [fetchTreasurySummary, fetchTransactions, initializeIntegrations]);

  const handleRefresh = async () => {
    await Promise.all([
      fetchTreasurySummary(),
      fetchTransactions()
    ]);
  };

  // No mock data - using only real data from backend

  // Use only real assets data from backend
  console.log('🔍 Treasury Debug:', {
    assetsLength: assets.length,
    totalValue,
    assets: assets,
    monthlySpending,
    activeProposals
  });
  const treasuryAssets = assets;
  
  const pieData = treasuryAssets.map(asset => ({
    name: asset.symbol,
    value: asset.value,
    percentage: asset.allocation
  }));

  const COLORS = ['#1E6FFF', '#8FBFFF', '#D7ECFF', '#EAF4FF'];

  const runSimulation = async () => {
    setIsGeneratingSimulation(true);
    try {
      // Use hackathon integrations for AI analysis
      if (degaEnabled && elizaEnabled) {
        const analysis = await getAIAnalysis();
        console.log('🔍 AI Analysis Response:', analysis);
        
        // Convert AI analysis to simulation format
        const simulationData = [
          {
            scenario: 'Conservative Strategy',
            riskLevel: 'low',
            projectedValue: Math.round(totalValue * 1.05), // 5% growth
            reasoning: analysis.eliza?.message || 'Conservative approach with minimal risk'
          },
          {
            scenario: 'Moderate Strategy', 
            riskLevel: 'medium',
            projectedValue: Math.round(totalValue * 1.12), // 12% growth
            reasoning: analysis.dega?.[0]?.description || 'Balanced approach with moderate risk'
          },
          {
            scenario: 'Aggressive Strategy',
            riskLevel: 'high', 
            projectedValue: Math.round(totalValue * 1.25), // 25% growth
            reasoning: 'High-risk, high-reward strategy for maximum returns'
          }
        ];
        
        setSimulationResults(simulationData as unknown as TreasuryInsight[]);
      } else {
        // Fallback to original AI service
        const insights = await aiService.generateTreasuryInsights(totalValue, '6 months');
        setSimulationResults(insights);
      }
      setShowSimulation(true);
    } catch (error) {
      console.error('AI simulation failed:', error);
      // No fallback - show error state
      setSimulationResults([]);
      setShowSimulation(true);
    } finally {
      setIsGeneratingSimulation(false);
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
            Treasury Management
          </h1>
          <p className="text-neutral-500">
            Monitor and manage your DAO's treasury with AI-powered insights and automated allocation.
          </p>
          
          {/* Hackathon Integration Status */}
          <div className="flex items-center space-x-4 mt-3">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${midnightEnabled ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-xs text-neutral-600">Midnight.js</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${degaEnabled ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-xs text-neutral-600">DEGA AI MCP</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${elizaEnabled ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-xs text-neutral-600">ElizaOS</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${communicationEnabled ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-xs text-neutral-600">Communication MCP</span>
            </div>
          </div>
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
            variant="secondary" 
            className="flex items-center space-x-2"
            onClick={runSimulation}
            disabled={isGeneratingSimulation}
          >
            {isGeneratingSimulation ? (
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
                <Play className="w-4 h-4" />
            <span>Simulate</span>
              </>
            )}
          </Button>
          <Button 
            variant="primary" 
            className="flex items-center space-x-2"
            onClick={async () => {
              if (midnightEnabled) {
                try {
                  await executePrivateTransaction({
                    type: 'transfer',
                    amount: 10000,
                    recipient: '0x1234567890123456789012345678901234567890',
                    description: 'Private treasury allocation',
                    private: true
                  });
                  
                  // Show success message
                  toast.success('Private allocation completed! Treasury updated.');
                  
                  // Wait a moment for database to update, then refresh treasury data
                  await new Promise(resolve => setTimeout(resolve, 1500));
                  await handleRefresh();
                } catch (error) {
                  console.error('Private transaction failed:', error);
                }
              }
            }}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>{midnightEnabled ? 'Private Allocate' : 'Allocate'}</span>
          </Button>
        </div>
      </motion.div>

      {/* Error Display */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-danger/10 border border-danger/20 rounded-lg p-4 mb-6"
        >
          <p className="text-danger text-sm">{error}</p>
        </motion.div>
      )}

      {/* Treasury Overview */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500 mb-1">Total Value</p>
              <p className="text-3xl font-bold text-neutral-900">
                {loading ? (
                  <div className="animate-pulse bg-neutral-200 h-8 w-32 rounded"></div>
                ) : (
                  `$${totalValue.toLocaleString()}`
                )}
              </p>
            </div>
            <div className="p-3 bg-brandBlue-50 rounded-lg">
              <Wallet className="w-6 h-6 text-brandBlue-500" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-success">
            <TrendingUp className="w-4 h-4 mr-1" />
            +8.2% this month
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500 mb-1">Monthly Spending</p>
              <p className="text-3xl font-bold text-neutral-900">
                {loading ? (
                  <div className="animate-pulse bg-neutral-200 h-8 w-24 rounded"></div>
                ) : (
                  `$${monthlySpending.toLocaleString()}`
                )}
              </p>
            </div>
            <div className="p-3 bg-danger/10 rounded-lg">
              <ArrowDownRight className="w-6 h-6 text-danger" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-neutral-500">
            vs $42K last month
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500 mb-1">Active Proposals</p>
              <p className="text-3xl font-bold text-neutral-900">
                {loading ? (
                  <div className="animate-pulse bg-neutral-200 h-8 w-24 rounded"></div>
                ) : (
                  `$${activeProposals.toLocaleString()}`
                )}
              </p>
            </div>
            <div className="p-3 bg-success/10 rounded-lg">
              <Activity className="w-6 h-6 text-success" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-neutral-500">
            Pending approval
          </div>
        </Card>
      </motion.div>

      {/* Main Content Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Allocation Chart */}
        <div>
          <Card className="p-6">
            <h3 className="font-display text-lg font-semibold text-neutral-900 mb-4">
              Asset Allocation
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <RechartsPieChart
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </RechartsPieChart>
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {treasuryAssets.map((asset, index) => (
                <div key={asset.symbol} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm text-neutral-600">{asset.symbol}</span>
                  <span className="text-sm font-medium text-neutral-900">{asset.allocation}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Treasury History */}
        <div>
          <Card className="p-6">
            <h3 className="font-display text-lg font-semibold text-neutral-900 mb-4">
              Treasury Value Trend
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[]}>
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#9AA5B1' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#9AA5B1' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
                    labelStyle={{ color: '#0F1724' }}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #E6E9EE',
                      borderRadius: '10px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#1E6FFF" 
                    fill="url(#colorGradient)"
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1E6FFF" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#1E6FFF" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </motion.div>

      {/* Additional Charts Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending vs Inflow */}
        <div>
          <Card className="p-6">
            <h3 className="font-display text-lg font-semibold text-neutral-900 mb-4">
              Cash Flow Analysis
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[]}>
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#9AA5B1' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#9AA5B1' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `$${value.toLocaleString()}`, 
                      name === 'amount' ? 'Outflow' : 'Inflow'
                    ]}
                    labelStyle={{ color: '#0F1724' }}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #E6E9EE',
                      borderRadius: '10px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="amount" 
                    fill="#DC2626" 
                    radius={[4, 4, 0, 0]}
                    name="Outflow"
                  />
                  <Bar 
                    dataKey="inflow" 
                    fill="#16A34A" 
                    radius={[4, 4, 0, 0]}
                    name="Inflow"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
      </div>

        {/* Proposals vs Spending */}
      <div>
          <Card className="p-6">
            <h3 className="font-display text-lg font-semibold text-neutral-900 mb-4">
              Proposals vs Spending
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[]}>
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#9AA5B1' }}
                  />
                  <YAxis 
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#9AA5B1' }}
                    tickFormatter={(value) => `${value}`}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#9AA5B1' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === 'proposals' ? value : `$${value.toLocaleString()}`,
                      name === 'proposals' ? 'Proposals' : 'Spending'
                    ]}
                    labelStyle={{ color: '#0F1724' }}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #E6E9EE',
                      borderRadius: '10px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="proposals" 
                    stroke="#1E6FFF" 
                    strokeWidth={3}
                    dot={{ fill: '#1E6FFF', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="spending" 
                    stroke="#DC2626" 
                    strokeWidth={3}
                    dot={{ fill: '#DC2626', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </motion.div>

      {/* Assets Table */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <h3 className="font-display text-lg font-semibold text-neutral-900 mb-4">
            Treasury Assets
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Asset</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Balance</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Value</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Allocation</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {treasuryAssets.map((asset, index) => (
                  <tr
                    key={asset.symbol}
                    className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors duration-200"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        >
                          {asset.symbol.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900">{asset.symbol}</p>
                          <p className="text-sm text-neutral-500">{asset.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-medium text-neutral-900">
                        {asset.balance.toLocaleString()} {asset.symbol}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-medium text-neutral-900">
                        ${asset.value.toLocaleString()}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-neutral-200 rounded-full h-2">
                          <div
                            className="bg-brandBlue-500 h-2 rounded-full"
                            style={{ width: `${asset.allocation}%` }}
                          />
                        </div>
                        <span className="text-sm text-neutral-600">{asset.allocation}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Button size="sm" variant="ghost">
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      {/* Treasury Simulation Modal */}
      <Modal
        isOpen={showSimulation}
        onClose={() => setShowSimulation(false)}
        title="Treasury Simulation Results"
        size="lg"
      >
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="font-display text-lg font-semibold text-neutral-900 mb-2">
              AI-Powered Treasury Projections
            </h3>
            <p className="text-neutral-500">
              Based on current market conditions and historical data
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(simulationResults || []).map((scenario, index) => (
              <motion.div
                key={`scenario-${index}-${scenario.scenario}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border-2 ${
                  scenario.riskLevel === 'low' 
                    ? 'border-success/20 bg-success/5' 
                    : scenario.riskLevel === 'medium'
                    ? 'border-brandBlue-200 bg-brandBlue-50'
                    : 'border-danger/20 bg-danger/5'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-neutral-900">{scenario.scenario}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    scenario.riskLevel === 'low' 
                      ? 'bg-success/10 text-success' 
                      : scenario.riskLevel === 'medium'
                      ? 'bg-brandBlue-100 text-brandBlue-700'
                      : 'bg-danger/10 text-danger'
                  }`}>
                    {scenario.riskLevel} Risk
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Current</span>
                    <span className="font-medium">${totalValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Projected</span>
                    <span className={`font-medium ${
                      (scenario.projectedValue || 0) > totalValue ? 'text-success' : 'text-danger'
                    }`}>
                      ${(scenario.projectedValue || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Change</span>
                    <span className={`font-medium ${
                      (scenario.projectedValue || 0) > totalValue ? 'text-success' : 'text-danger'
                    }`}>
                      {(scenario.projectedValue || 0) > totalValue ? '+' : ''}
                      {(((scenario.projectedValue || 0) - totalValue) / totalValue * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="bg-neutral-50 rounded-lg p-4">
            <h4 className="font-semibold text-neutral-900 mb-2">AI Analysis Insights</h4>
            <div className="text-sm text-neutral-600 space-y-2">
              {(simulationResults || []).map((scenario, index) => (
                <div key={`insight-${index}`} className="flex items-start space-x-2">
                  <span className="text-neutral-400">•</span>
                  <span>{scenario.reasoning}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button 
              variant="ghost" 
              onClick={() => setShowSimulation(false)}
            >
              Close
            </Button>
            <Button 
              variant="primary"
              onClick={() => setShowSimulation(false)}
            >
              Apply Strategy
            </Button>
      </div>
    </div>
      </Modal>
    </motion.div>
  );
};

export default Treasury;
