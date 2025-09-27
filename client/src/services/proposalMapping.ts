/**
 * Proposal ID Mapping Service
 * 
 * This service handles the mapping between database proposal IDs (MongoDB ObjectIds)
 * and blockchain proposal IDs (sequential numbers).
 * 
 * In a production system, this mapping should be stored in the database.
 * For now, we'll use a simple in-memory mapping.
 */

interface ProposalMapping {
  databaseId: string;
  blockchainId: string;
  title: string;
  createdAt: Date;
}

class ProposalMappingService {
  private mappings: Map<string, ProposalMapping> = new Map();
  private reverseMappings: Map<string, ProposalMapping> = new Map();

  /**
   * Add a new proposal mapping
   */
  addMapping(databaseId: string, blockchainId: string, title: string): void {
    const mapping: ProposalMapping = {
      databaseId,
      blockchainId,
      title,
      createdAt: new Date()
    };

    this.mappings.set(databaseId, mapping);
    this.reverseMappings.set(blockchainId, mapping);

    console.log(`📝 Added proposal mapping: DB ${databaseId} -> Blockchain ${blockchainId} (${title})`);
  }

  /**
   * Get blockchain ID from database ID
   */
  getBlockchainId(databaseId: string): string | null {
    const mapping = this.mappings.get(databaseId);
    return mapping ? mapping.blockchainId : null;
  }

  /**
   * Get database ID from blockchain ID
   */
  getDatabaseId(blockchainId: string): string | null {
    const mapping = this.reverseMappings.get(blockchainId);
    return mapping ? mapping.databaseId : null;
  }

  /**
   * Check if a database ID has a blockchain mapping
   */
  hasBlockchainMapping(databaseId: string): boolean {
    return this.mappings.has(databaseId);
  }

  /**
   * Check if a blockchain ID has a database mapping
   */
  hasDatabaseMapping(blockchainId: string): boolean {
    return this.reverseMappings.has(blockchainId);
  }

  /**
   * Get all mappings
   */
  getAllMappings(): ProposalMapping[] {
    return Array.from(this.mappings.values());
  }

  /**
   * Clear all mappings (useful for testing)
   */
  clearMappings(): void {
    this.mappings.clear();
    this.reverseMappings.clear();
    console.log('🗑️ Cleared all proposal mappings');
  }

  /**
   * Get mapping info for debugging
   */
  getMappingInfo(): {
    totalMappings: number;
    databaseIds: string[];
    blockchainIds: string[];
  } {
    return {
      totalMappings: this.mappings.size,
      databaseIds: Array.from(this.mappings.keys()),
      blockchainIds: Array.from(this.reverseMappings.keys())
    };
  }

  /**
   * Debug function to log all current mappings
   */
  debugMappings(): void {
    console.log('🔍 Current Proposal Mappings:');
    console.log('Total mappings:', this.mappings.size);
    
    if (this.mappings.size === 0) {
      console.log('No mappings found');
      return;
    }
    
    this.mappings.forEach((mapping, dbId) => {
      console.log(`  DB ID: ${dbId} -> Blockchain ID: ${mapping.blockchainId} (${mapping.title})`);
    });
  }

  /**
   * Clear mappings for testing (useful for development)
   */
  clearMappingsForTesting(): void {
    console.log('🧹 Clearing all mappings for testing...');
    this.clearMappings();
  }
}

export const proposalMappingService = new ProposalMappingService();
export default proposalMappingService;
