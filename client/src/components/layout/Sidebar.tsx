import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  Wallet, 
  Settings, 
  Users, 
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react';
import { useWalletStore } from '../../stores/walletStore';
import zyraLogo from '../../assets/zyra-logo.png';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle, isMobile = false }) => {
  const { account, isConnected, connect } = useWalletStore();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/' },
    { icon: FileText, label: 'Proposals', path: '/proposals' },
    { icon: Wallet, label: 'Treasury', path: '/treasury' },
    { icon: Users, label: 'Members', path: '/members' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <motion.aside
      className={`bg-white border-r border-neutral-300 flex flex-col h-full ${
        isMobile ? 'w-80' : ''
      }`}
      initial={isMobile ? { x: -300 } : { width: 300 }}
      animate={isMobile ? { x: 0 } : { width: isCollapsed ? 80 : 300 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* Header */}
      <div className="p-4 border-b border-neutral-300">
        <div className="flex items-center justify-between">
          <AnimatePresence>
            {!isCollapsed ? (
              <motion.img
                src={zyraLogo}
                alt="Zyra"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="h-8 w-auto"
              />
            ) : (
              <motion.img
                src={zyraLogo}
                alt="Zyra"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-6 w-auto"
              />
            )}
          </AnimatePresence>
          
          <button
            onClick={onToggle}
            className="p-2 hover:bg-neutral-100 rounded-base transition-colors duration-200"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5 text-neutral-500" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-neutral-500" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-base transition-colors duration-200 group ${
                    isActive
                      ? 'bg-brandBlue-50 text-brandBlue-700 border-r-2 border-brandBlue-500'
                      : 'hover:bg-brandBlue-50 text-neutral-700 hover:text-brandBlue-700'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-brandBlue-500' : ''}`} />
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="ml-3 font-medium"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </nav>

      {/* User Profile / Wallet Connection */}
      <div className="p-4 border-t border-neutral-300">
        {isConnected && account ? (
          <div className="space-y-3">
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="p-3 bg-neutral-100 rounded-lg"
                >
                  <div className="text-xs text-neutral-500 mb-1">Connected Wallet</div>
                  <div className="font-mono text-sm text-neutral-900 truncate">
                    {`${account.slice(0, 6)}...${account.slice(-4)}`}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <motion.button
              className="w-full flex items-center justify-center px-3 py-2 bg-brandBlue-500 hover:bg-brandBlue-700 text-white rounded-base transition-colors duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-5 h-5" />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="ml-2 font-medium"
                  >
                    New Proposal
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        ) : (
          <motion.button
            onClick={connect}
            className="w-full flex items-center justify-center px-3 py-2 bg-brandBlue-500 hover:bg-brandBlue-700 text-white rounded-base transition-colors duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Wallet className="w-5 h-5" />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="ml-2 font-medium"
                >
                  Connect Wallet
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </div>
    </motion.aside>
  );
};

export default Sidebar;
