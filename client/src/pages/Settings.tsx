import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  Save, 
  RefreshCw,
  Bell,
  Shield,
  Globe,
  Database,
  Key,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useWalletStore } from '../stores/walletStore';

interface DAOSettings {
  name: string;
  description: string;
  logo: string;
  votingDuration: number;
  quorumPercentage: number;
  treasuryThreshold: number;
  notifications: {
    email: boolean;
    push: boolean;
    proposals: boolean;
    votes: boolean;
    treasury: boolean;
  };
  privacy: {
    publicProposals: boolean;
    showVoterAddresses: boolean;
    anonymousVoting: boolean;
  };
  integrations: {
    discord: string;
    telegram: string;
    twitter: string;
    github: string;
  };
}

const Settings: React.FC = () => {
  const { isConnected } = useWalletStore();
  const [settings, setSettings] = useState<DAOSettings>({
    name: 'Zyra DAO',
    description: 'A privacy-first DAO with AI-powered insights and commit-reveal voting.',
    logo: '',
    votingDuration: 7,
    quorumPercentage: 30,
    treasuryThreshold: 10000,
    notifications: {
      email: true,
      push: true,
      proposals: true,
      votes: true,
      treasury: true,
    },
    privacy: {
      publicProposals: true,
      showVoterAddresses: false,
      anonymousVoting: true,
    },
    integrations: {
      discord: '',
      telegram: '',
      twitter: '',
      github: '',
    }
  });

  // const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        // TODO: Replace with real API call
        // const response = await api.settings.get();
        // setSettings(response.data);
        
        // For now, use mock data
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      } catch (error: any) {
        console.error('Failed to fetch settings:', error);
        setError('Failed to load settings');
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      // TODO: Replace with real API call
      // await api.settings.update(settings);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Settings saved successfully!');
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setSettings(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof DAOSettings] as any),
          [child]: value
        }
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [field]: value
      }));
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
            Settings
          </h1>
          <p className="text-neutral-500">
            Configure your DAO settings, notifications, and integrations.
          </p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="secondary"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button 
            variant="primary"
            onClick={handleSave}
            loading={saving}
            disabled={!isConnected}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </motion.div>

      {/* Status Messages */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-danger/10 border border-danger/20 rounded-lg p-4 flex items-center space-x-2"
        >
          <AlertTriangle className="w-5 h-5 text-danger" />
          <p className="text-danger text-sm">{error}</p>
        </motion.div>
      )}

      {success && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-success/10 border border-success/20 rounded-lg p-4 flex items-center space-x-2"
        >
          <CheckCircle className="w-5 h-5 text-success" />
          <p className="text-success text-sm">{success}</p>
        </motion.div>
      )}

      {/* Connection Status */}
      {!isConnected && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-warning/10 border border-warning/20 rounded-lg p-4 flex items-center space-x-2"
        >
          <AlertTriangle className="w-5 h-5 text-warning" />
          <p className="text-warning text-sm">
            Connect your wallet to modify DAO settings.
          </p>
        </motion.div>
      )}

      {/* Basic Settings */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <SettingsIcon className="w-5 h-5 text-brandBlue-500" />
            <h2 className="font-display text-xl font-semibold text-neutral-900">
              Basic Settings
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                DAO Name
              </label>
              <Input
                value={settings.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter DAO name"
                disabled={!isConnected}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Voting Duration (days)
              </label>
              <Input
                type="number"
                value={settings.votingDuration}
                onChange={(e) => handleInputChange('votingDuration', parseInt(e.target.value))}
                placeholder="7"
                disabled={!isConnected}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Description
              </label>
              <textarea
                value={settings.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter DAO description"
                disabled={!isConnected}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brandBlue-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Governance Settings */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Shield className="w-5 h-5 text-brandBlue-500" />
            <h2 className="font-display text-xl font-semibold text-neutral-900">
              Governance Settings
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Quorum Percentage (%)
              </label>
              <Input
                type="number"
                value={settings.quorumPercentage}
                onChange={(e) => handleInputChange('quorumPercentage', parseInt(e.target.value))}
                placeholder="30"
                disabled={!isConnected}
              />
              <p className="text-xs text-neutral-500 mt-1">
                Minimum percentage of members required to vote
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Treasury Threshold ($)
              </label>
              <Input
                type="number"
                value={settings.treasuryThreshold}
                onChange={(e) => handleInputChange('treasuryThreshold', parseInt(e.target.value))}
                placeholder="10000"
                disabled={!isConnected}
              />
              <p className="text-xs text-neutral-500 mt-1">
                Minimum amount requiring proposal approval
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Notifications */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Bell className="w-5 h-5 text-brandBlue-500" />
            <h2 className="font-display text-xl font-semibold text-neutral-900">
              Notifications
            </h2>
          </div>
          
          <div className="space-y-4">
            {Object.entries(settings.notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-neutral-700 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <p className="text-xs text-neutral-500">
                    {key === 'email' && 'Receive notifications via email'}
                    {key === 'push' && 'Receive browser push notifications'}
                    {key === 'proposals' && 'Get notified about new proposals'}
                    {key === 'votes' && 'Get notified about voting deadlines'}
                    {key === 'treasury' && 'Get notified about treasury activities'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => handleInputChange(`notifications.${key}`, e.target.checked)}
                    disabled={!isConnected}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brandBlue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brandBlue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Privacy Settings */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Globe className="w-5 h-5 text-brandBlue-500" />
            <h2 className="font-display text-xl font-semibold text-neutral-900">
              Privacy Settings
            </h2>
          </div>
          
          <div className="space-y-4">
            {Object.entries(settings.privacy).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-neutral-700 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <p className="text-xs text-neutral-500">
                    {key === 'publicProposals' && 'Make proposals visible to non-members'}
                    {key === 'showVoterAddresses' && 'Display voter wallet addresses publicly'}
                    {key === 'anonymousVoting' && 'Enable anonymous voting mechanism'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => handleInputChange(`privacy.${key}`, e.target.checked)}
                    disabled={!isConnected}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brandBlue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brandBlue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Integrations */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Database className="w-5 h-5 text-brandBlue-500" />
            <h2 className="font-display text-xl font-semibold text-neutral-900">
              Integrations
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(settings.integrations).map(([key, value]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-neutral-700 mb-2 capitalize">
                  {key}
                </label>
                <Input
                  value={value}
                  onChange={(e) => handleInputChange(`integrations.${key}`, e.target.value)}
                  placeholder={`Enter ${key} URL or ID`}
                  disabled={!isConnected}
                />
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* API Keys */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Key className="w-5 h-5 text-brandBlue-500" />
            <h2 className="font-display text-xl font-semibold text-neutral-900">
              API Keys
            </h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Hugging Face API Key
              </label>
              <div className="flex space-x-2">
                <Input
                  type={showApiKey ? "text" : "password"}
                  value="hf_your_hugging_face_token"
                  disabled
                  className="flex-1"
                />
                <Button
                  variant="secondary"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Used for AI-powered proposal analysis and treasury insights
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default Settings;
