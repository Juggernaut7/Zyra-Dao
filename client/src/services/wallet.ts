import { ethers, BrowserProvider } from 'ethers';
import type { Signer } from 'ethers';
import { api } from './api';

export interface WalletConnection {
  address: string;
  token: string;
  signer: Signer;
  provider: BrowserProvider;
}

class WalletService {
  private provider: BrowserProvider | null = null;
  private signer: Signer | null = null;
  private listeners: Array<(accounts: string[]) => void> = [];

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      // Listen for account changes
      (window as any).ethereum.on('accountsChanged', (accounts: string[]) => {
        this.notifyListeners(accounts);
      });
    }
  }

  private notifyListeners(accounts: string[]) {
    this.listeners.forEach(listener => listener(accounts));
  }

  public onAccountsChanged(listener: (accounts: string[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public removeAllListeners() {
    this.listeners = [];
  }

  public async connectWallet(): Promise<WalletConnection> {
    console.log('🔗 Wallet connection initiated...');
    
    if (!(window as any).ethereum) {
      console.error('❌ MetaMask not detected');
      throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
    }

    console.log('✅ MetaMask detected');

    try {
      // Request account access
      console.log('🔐 Requesting account access...');
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      console.log('✅ Accounts received:', accounts);
      
      // Create provider and signer
      console.log('🔧 Creating provider and signer...');
      this.provider = new BrowserProvider((window as any).ethereum);
      this.signer = await this.provider.getSigner();
      console.log('✅ Provider and signer created');
      
      // Get account details
      const address = await this.signer.getAddress();
      console.log('📍 Wallet address:', address);
      
      // Create authentication message
      const message = `Zyra login ${Date.now()}`;
      console.log('✍️ Signing message for authentication...');
      const signature = await this.signer.signMessage(message);
      console.log('✅ Message signed');
      
      // Authenticate with backend
      console.log('🔑 Authenticating with backend...');
      const response = await api.auth.login({ address, message, signature });
      console.log('🔍 Backend response:', response.data);
      
      const token = response.data.data?.token || response.data.token;
      if (!token) {
        throw new Error('No authentication token received from backend');
      }
      console.log('✅ Backend authentication successful, token received');
      
      const connection: WalletConnection = {
        address,
        token,
        signer: this.signer!,
        provider: this.provider!,
      };

      console.log('🎉 Wallet connected successfully!');
      return connection;
    } catch (error: any) {
      console.error('❌ Wallet connection failed:', error);
      
      // Provide more specific error messages
      if (error.code === 4001) {
        throw new Error('User rejected the connection request');
      } else if (error.code === -32002) {
        throw new Error('Connection request already pending. Please check MetaMask.');
      } else if (error.message?.includes('User denied')) {
        throw new Error('User denied the signature request');
      } else if (error.message?.includes('network')) {
        throw new Error('Network error. Please check your internet connection.');
      } else {
        throw new Error(error.message || 'Failed to connect wallet');
      }
    }
  }

  public disconnectWallet(): void {
    this.provider = null;
    this.signer = null;
  }

  public async signMessage(message: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      const signature = await this.signer.signMessage(message);
      return signature;
    } catch (error) {
      console.error('Failed to sign message:', error);
      throw error;
    }
  }

  public async getBalance(): Promise<string> {
    if (!this.provider || !this.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      const address = await this.signer.getAddress();
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw error;
    }
  }

  public async switchToSepolia(): Promise<void> {
    if (!(window as any).ethereum) {
      throw new Error('MetaMask is not installed');
    }

    try {
      // Try to switch to Sepolia
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia chain ID in hex
      });
    } catch (error: any) {
      // If the network doesn't exist, add it
      if (error.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xaa36a7', // 11155111 in hex
              chainName: 'Sepolia test network',
              nativeCurrency: {
                name: 'Sepolia Ether',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: ['https://rpc.sepolia.org'],
              blockExplorerUrls: ['https://sepolia.etherscan.io'],
            }],
          });
        } catch (addError) {
          console.error('Failed to add Sepolia network:', addError);
          throw new Error('Failed to add Sepolia network to MetaMask');
        }
      } else {
        console.error('Failed to switch to Sepolia:', error);
        throw new Error('Failed to switch to Sepolia network');
      }
    }
  }

  public async getCurrentNetwork(): Promise<{ chainId: string; name: string }> {
    if (!(window as any).ethereum) {
      throw new Error('MetaMask is not installed');
    }

    try {
      const chainId = await (window as any).ethereum.request({ method: 'eth_chainId' });
      const networkNames: { [key: string]: string } = {
        '0x1': 'Ethereum Mainnet',
        '0xaa36a7': 'Sepolia test network',
        '0x5': 'Goerli test network',
        '0x89': 'Polygon Mainnet',
        '0x13881': 'Polygon Mumbai',
      };
      
      return {
        chainId,
        name: networkNames[chainId] || `Unknown Network (${chainId})`
      };
    } catch (error) {
      console.error('Failed to get current network:', error);
      throw error;
    }
  }

}

export const walletService = new WalletService();
export default walletService;