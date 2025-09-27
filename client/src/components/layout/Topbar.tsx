import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Bell, 
  User,
  Settings,
  LogOut,
  Menu,
  Wifi
} from 'lucide-react';
import { useWalletStore } from '../../stores/walletStore';
import { walletService } from '../../services/wallet';

interface TopbarProps {
  onMenuClick?: () => void;
  isMobile?: boolean;
}

const Topbar: React.FC<TopbarProps> = ({ onMenuClick, isMobile = false }) => {
  const { account, isConnected, disconnect, connect, loading, error } = useWalletStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentNetwork, setCurrentNetwork] = useState<string>('');
  const [switchingNetwork, setSwitchingNetwork] = useState(false);

  // Get current network
  React.useEffect(() => {
    const getNetwork = async () => {
      try {
        const network = await walletService.getCurrentNetwork();
        setCurrentNetwork(network.name);
      } catch (error) {
        console.error('Failed to get current network:', error);
      }
    };
    
    if (isConnected) {
      getNetwork();
    }
  }, [isConnected]);

  const handleSwitchToSepolia = async () => {
    setSwitchingNetwork(true);
    try {
      await walletService.switchToSepolia();
      const network = await walletService.getCurrentNetwork();
      setCurrentNetwork(network.name);
    } catch (error: any) {
      console.error('Failed to switch network:', error);
      alert(`Failed to switch network: ${error.message}`);
    } finally {
      setSwitchingNetwork(false);
    }
  };

  return (
    <motion.header
      className="bg-white/80 backdrop-blur-sm border-b border-neutral-300 px-4 lg:px-6 py-4 flex items-center justify-between sticky top-0 z-40"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* Mobile Menu Button */}
      {isMobile && (
        <motion.button
          onClick={onMenuClick}
          className="p-2 hover:bg-neutral-100 rounded-base transition-colors duration-200 mr-3"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Menu className="w-5 h-5 text-neutral-500" />
        </motion.button>
      )}

      {/* Search */}
      <div className={`flex-1 ${isMobile ? 'max-w-xs' : 'max-w-md'}`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder={isMobile ? "Search..." : "Search proposals, members..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-100 border border-neutral-300 rounded-base focus:outline-none focus:ring-2 focus:ring-brandBlue-100 focus:border-brandBlue-500 transition-all duration-200"
          />
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center space-x-4">
        {/* Network Switch Button */}
        {isConnected && (
          <motion.button
            onClick={handleSwitchToSepolia}
            disabled={switchingNetwork}
            className={`px-3 py-2 rounded-base text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
              currentNetwork === 'Sepolia test network'
                ? 'bg-success/10 text-success border border-success/20'
                : 'bg-brandBlue-500 hover:bg-brandBlue-700 text-white'
            } ${switchingNetwork ? 'opacity-50 cursor-not-allowed' : ''}`}
            whileHover={switchingNetwork ? {} : { scale: 1.02 }}
            whileTap={switchingNetwork ? {} : { scale: 0.98 }}
          >
            <Wifi className="w-4 h-4" />
            <span>
              {switchingNetwork 
                ? 'Switching...' 
                : currentNetwork === 'Sepolia test network' 
                  ? 'Sepolia' 
                  : 'Switch to Sepolia'
              }
            </span>
          </motion.button>
        )}

        {/* Notifications */}
        <motion.button
          className="relative p-2 hover:bg-neutral-100 rounded-base transition-colors duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Bell className="w-5 h-5 text-neutral-500" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-danger rounded-full"></span>
        </motion.button>

            {/* Connect Wallet / User menu */}
            {!isConnected ? (
              <div className="flex flex-col items-end">
                <motion.button
                  onClick={connect}
                  disabled={loading}
                  className="px-4 py-2 bg-brandBlue-500 hover:bg-brandBlue-700 disabled:bg-neutral-400 disabled:cursor-not-allowed text-white rounded-base text-sm font-medium transition-colors duration-200"
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      <span>Connecting...</span>
                    </div>
                  ) : (
                    'Connect Wallet'
                  )}
                </motion.button>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-danger mt-1 max-w-xs text-right"
                  >
                    {error}
                  </motion.p>
                )}
              </div>
            ) : account && (
          <div className="relative">
            <motion.button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 hover:bg-neutral-100 rounded-base transition-colors duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-8 h-8 bg-brandBlue-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-neutral-900">
                  {`${account.slice(0, 6)}...${account.slice(-4)}`}
                </div>
                <div className="text-xs text-neutral-500">
                  {currentNetwork || 'DAO Member'}
                </div>
              </div>
            </motion.button>

            {/* Dropdown menu */}
            {showUserMenu && (
              <motion.div
                className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-300 py-1 z-50"
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <button className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
                <button 
                  onClick={handleSwitchToSepolia}
                  disabled={switchingNetwork}
                  className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 flex items-center space-x-2 disabled:opacity-50"
                >
                  <Wifi className="w-4 h-4" />
                  <span>{switchingNetwork ? 'Switching...' : 'Switch to Sepolia'}</span>
                </button>
                <button 
                  onClick={disconnect}
                  className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Disconnect</span>
                </button>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </motion.header>
  );
};

export default Topbar;
