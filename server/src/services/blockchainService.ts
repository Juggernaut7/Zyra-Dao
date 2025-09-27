import { ethers } from 'ethers';
import { config } from '../config/index.ts';
import { logger } from '../utils/logger.ts';

class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet | null = null;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    
    if (config.privateKey) {
      this.wallet = new ethers.Wallet(config.privateKey, this.provider);
      logger.info('Blockchain service initialized with wallet');
    } else {
      logger.warn('Blockchain service initialized without wallet (read-only mode)');
    }
  }

  /**
   * Verify a wallet signature
   */
  async verifySignature(message: string, signature: string): Promise<string> {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress;
    } catch (error) {
      logger.error('Signature verification failed:', error);
      throw new Error('Invalid signature');
    }
  }

  /**
   * Get wallet balance
   */
  async getBalance(address: string): Promise<string> {
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      logger.error('Failed to get balance:', error);
      throw new Error('Failed to retrieve balance');
    }
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<string> {
    try {
      const gasPrice = await this.provider.getGasPrice();
      return ethers.formatUnits(gasPrice, 'gwei');
    } catch (error) {
      logger.error('Failed to get gas price:', error);
      throw new Error('Failed to retrieve gas price');
    }
  }

  /**
   * Get network information
   */
  async getNetworkInfo() {
    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      const gasPrice = await this.getGasPrice();

      return {
        chainId: Number(network.chainId),
        name: network.name,
        blockNumber,
        gasPrice: `${gasPrice} gwei`
      };
    } catch (error) {
      logger.error('Failed to get network info:', error);
      throw new Error('Failed to retrieve network information');
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(txHash: string, confirmations: number = 1) {
    try {
      const receipt = await this.provider.waitForTransaction(txHash, confirmations);
      return receipt;
    } catch (error) {
      logger.error('Failed to wait for transaction:', error);
      throw new Error('Transaction confirmation failed');
    }
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string) {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      return receipt;
    } catch (error) {
      logger.error('Failed to get transaction receipt:', error);
      throw new Error('Failed to retrieve transaction receipt');
    }
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(transaction: any): Promise<bigint> {
    try {
      const gasEstimate = await this.provider.estimateGas(transaction);
      return gasEstimate;
    } catch (error) {
      logger.error('Gas estimation failed:', error);
      throw new Error('Failed to estimate gas');
    }
  }

  /**
   * Send a transaction (requires wallet)
   */
  async sendTransaction(transaction: any) {
    if (!this.wallet) {
      throw new Error('Wallet not configured');
    }

    try {
      const tx = await this.wallet.sendTransaction(transaction);
      return tx;
    } catch (error) {
      logger.error('Transaction failed:', error);
      throw new Error('Transaction failed');
    }
  }

  /**
   * Generate a commit hash for voting
   */
  generateCommitHash(vote: 'yes' | 'no', salt: string): string {
    const message = `${vote}:${salt}`;
    return ethers.keccak256(ethers.toUtf8Bytes(message));
  }

  /**
   * Verify a commit hash
   */
  verifyCommitHash(vote: 'yes' | 'no', salt: string, commitHash: string): boolean {
    const expectedHash = this.generateCommitHash(vote, salt);
    return expectedHash === commitHash;
  }

  /**
   * Generate a random salt for voting
   */
  generateSalt(): string {
    return ethers.randomBytes(32).toString('hex');
  }

  /**
   * Check if address is a contract
   */
  async isContract(address: string): Promise<boolean> {
    try {
      const code = await this.provider.getCode(address);
      return code !== '0x';
    } catch (error) {
      logger.error('Failed to check if address is contract:', error);
      return false;
    }
  }

  /**
   * Get block information
   */
  async getBlock(blockNumber: number | string) {
    try {
      const block = await this.provider.getBlock(blockNumber);
      return block;
    } catch (error) {
      logger.error('Failed to get block:', error);
      throw new Error('Failed to retrieve block information');
    }
  }
}

export const blockchainService = new BlockchainService();
export default blockchainService;
