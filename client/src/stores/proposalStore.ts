import { create } from 'zustand';
import { api } from '../services/api';

export interface Proposal {
  _id: string;
  title: string;
  description: string;
  proposer: string;
  amountRequested: number;
  category: 'treasury' | 'governance' | 'grants' | 'infrastructure' | 'marketing';
  status: 'draft' | 'active' | 'committed' | 'revealed' | 'executed' | 'rejected';
  commitEndTime: string;
  revealEndTime: string;
  voteCount: {
    yes: number;
    no: number;
    total: number;
  };
  createdAt: string;
  updatedAt: string;
  treasuryAction?: {
    type: 'transfer' | 'investment' | 'allocation';
    recipient?: string;
    amount?: number;
    description?: string;
  };
}

interface ProposalState {
  proposals: Proposal[];
  currentProposal: Proposal | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  fetchProposals: (params?: { page?: number; limit?: number; category?: string; status?: string }) => Promise<void>;
  fetchProposal: (id: string) => Promise<void>;
  createProposal: (proposal: Omit<Proposal, '_id' | 'createdAt' | 'updatedAt' | 'voteCount'>) => Promise<void>;
  setCurrentProposal: (proposal: Proposal | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useProposalStore = create<ProposalState>((set, _get) => ({
  proposals: [],
  currentProposal: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },

  fetchProposals: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await api.proposals.getAll(params);
      const { data, pagination } = response.data;
      set({ 
        proposals: data, 
        pagination,
        loading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch proposals', 
        loading: false 
      });
    }
  },

  fetchProposal: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.proposals.getById(id);
      set({ 
        currentProposal: response.data.data.proposal, 
        loading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch proposal', 
        loading: false 
      });
    }
  },

  createProposal: async (proposalData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.proposals.create(proposalData);
      const newProposal = response.data.data.proposal;
      set((state) => ({
        proposals: [newProposal, ...state.proposals],
        loading: false,
      }));
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to create proposal', 
        loading: false 
      });
    }
  },

  setCurrentProposal: (proposal) => set({ currentProposal: proposal }),
  clearError: () => set({ error: null }),
  setLoading: (loading) => set({ loading })
}));
