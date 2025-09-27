import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { walletService } from '../services/wallet';
import type { WalletConnection } from '../services/wallet';

interface WalletState {
  isConnected: boolean;
  account: string | null;
  balance: string | null;
  token: string | null;
  connection: WalletConnection | null;
  loading: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  updateBalance: () => Promise<void>;
  clearError: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
  isConnected: false,
  account: null,
  balance: null,
  token: null,
  connection: null,
  loading: false,
  error: null,

  connect: async () => {
    console.log('🚀 Wallet store connect called');
    set({ loading: true, error: null });
    
    try {
      console.log('📞 Calling walletService.connectWallet()...');
      const connection = await walletService.connectWallet();
      console.log('✅ Wallet service returned connection:', connection);
      
      set({
        isConnected: true,
        account: connection.address,
        token: connection.token,
        connection,
        loading: false,
        error: null,
      });
      
      // Save token to localStorage for API requests
      if (connection.token) {
        localStorage.setItem('token', connection.token);
      }
      
      console.log('✅ Wallet store state updated');
      
      // Update balance
      get().updateBalance();
      
      // Set up event listeners
      walletService.onAccountsChanged((accounts: string[]) => {
        console.log('🔄 Account change detected:', accounts);
        if (accounts.length === 0) {
          get().disconnect();
        } else if (accounts[0] !== get().account) {
          // Account changed, reconnect
          get().connect();
        }
      });
      
    } catch (error: any) {
      console.error('❌ Wallet store connect error:', error);
      set({ 
        error: error.message || 'Failed to connect wallet', 
        loading: false,
        isConnected: false,
        account: null,
        token: null,
        connection: null,
      });
    }
  },

  disconnect: () => {
    walletService.disconnectWallet();
    walletService.removeAllListeners();
    
    // Clear token from localStorage
    localStorage.removeItem('token');
    
    set({
      isConnected: false,
      account: null,
      balance: null,
      token: null,
      connection: null,
    });
  },

  updateBalance: async () => {
    const { account } = get();
    if (account) {
      try {
        const balance = await walletService.getBalance();
        set({ balance });
      } catch (error) {
        console.error('Failed to update balance:', error);
      }
    }
  },

  clearError: () => set({ error: null }),
    }),
    {
      name: 'wallet-storage',
      partialize: (state) => ({
        isConnected: state.isConnected,
        account: state.account,
        token: state.token,
      }),
      onRehydrateStorage: () => (state) => {
        // Reconnect wallet on page reload if previously connected
        if (state?.isConnected && state?.account && state?.token) {
          console.log('🔄 Restoring wallet connection on page load...');
          
          // Restore token to localStorage for API requests
          localStorage.setItem('token', state.token);
          
          // Set up account change listeners
          walletService.onAccountsChanged((accounts: string[]) => {
            if (accounts.length === 0) {
              _get().disconnect();
            } else if (accounts[0] !== _get().account) {
              _get().connect();
            }
          });
        }
      },
    }
  )
);
