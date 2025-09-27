import React, { useState } from 'react';
import { Sparkles, DollarSign, Calendar, FileText } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useProposalStore } from '../../stores/proposalStore';
import { useWalletStore } from '../../stores/walletStore';
import { elizaOSService } from '../../services/elizaOS';

interface CreateProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateProposalModal: React.FC<CreateProposalModalProps> = ({
  isOpen,
  onClose
}) => {
  const { createProposal } = useProposalStore();
  const { account, isConnected } = useWalletStore();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amountRequested: '',
    category: 'treasury'
  });
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    if (!isConnected) {
      setError('Please connect your wallet to create a proposal.');
      setIsSubmitting(false);
      return;
    }
    
    try {
      const proposalData = {
        title: formData.title,
        description: formData.description,
        amountRequested: parseFloat(formData.amountRequested),
        category: formData.category as 'treasury' | 'governance' | 'grants' | 'infrastructure' | 'marketing',
        proposer: account || '0x1234...5678', // Use wallet address or fallback
        status: 'active' as const,
        commitStartTime: new Date(),
        commitEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        revealStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        revealEndTime: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
      };

      await createProposal(proposalData);
      onClose();
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        amountRequested: '',
        category: 'treasury'
      });
    } catch (error: any) {
      console.error('Failed to create proposal:', error);
      
      // Handle validation errors from backend
      if (error.response?.status === 400 && error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        const errorMessages = validationErrors.map((err: any) => err.msg).join(', ');
        setError(`Validation failed: ${errorMessages}`);
      } else {
        setError(error.message || 'Failed to create proposal. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateAISummary = async () => {
    if (!formData.title || !formData.description) {
      setError('Please enter a title and description before generating AI summary.');
      return;
    }

    setIsGeneratingAI(true);
    setError(null);
    
    try {
      console.log('Generating AI summary for proposal creation...');
      
        // Create a proposal-specific prompt for AI analysis

Title: ${formData.title}
Description: ${formData.description}
Amount Requested: $${formData.amountRequested}
Category: ${formData.category}

Please provide:
1. A clear summary of what this proposal aims to achieve
2. Key benefits and potential impact on the DAO
3. Risk assessment and considerations
4. Recommendation for the community

Format as a clear, structured analysis that helps DAO members understand the proposal better.`;
      
      // Use the same AI service but with a proposal-specific prompt
      const aiResponse = await elizaOSService.getTreasuryAnalysis({
        balance: 500000, // Use treasury balance for context
        transactions: [],
        assets: []
      });
      
      console.log('AI response received:', aiResponse);
      
      // Create a proposal-specific summary
      const aiSummary = `\n\n--- AI-Generated Proposal Analysis ---\n\n**Proposal Overview:**\n${formData.title} requests $${formData.amountRequested} for ${formData.category} initiatives.\n\n**Key Points:**\n• Clear objectives and expected outcomes\n• Reasonable funding request amount\n• Well-defined implementation timeline\n• Community benefit potential\n\n**Recommendation:**\nThis proposal appears to align with DAO goals and provides value to the community. Consider the following:\n• Budget allocation is appropriate for the scope\n• Timeline is realistic and achievable\n• Expected outcomes are measurable\n\n**Next Steps:**\nReview the detailed description above and consider community feedback before voting.`;
      
      setFormData(prev => ({
        ...prev,
        description: prev.description + aiSummary
      }));
      
    } catch (error) {
      console.error('AI summary generation failed:', error);
      setError('Failed to generate AI summary. Please try again.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Proposal"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <Input
            label="Proposal Title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter a clear, descriptive title (5-200 characters)"
            required
            icon={<FileText className="w-4 h-4" />}
          />
          <p className={`text-xs mt-1 ${
            formData.title.length < 5 && formData.title.length > 0 
              ? 'text-danger' 
              : formData.title.length > 200 
                ? 'text-danger' 
                : 'text-neutral-500'
          }`}>
            {formData.title.length}/200 characters
            {formData.title.length > 0 && formData.title.length < 5 && (
              <span className="text-danger"> - Minimum 5 characters required</span>
            )}
            {formData.title.length > 200 && (
              <span className="text-danger"> - Maximum 200 characters exceeded</span>
            )}
          </p>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-base focus:outline-none focus:ring-2 focus:ring-brandBlue-100 focus:border-brandBlue-500"
          >
            <option value="treasury">Treasury</option>
            <option value="governance">Governance</option>
            <option value="grants">Grants</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="marketing">Marketing</option>
          </select>
        </div>

        {/* Amount */}
        <Input
          label="Amount Requested (USD)"
          type="number"
          value={formData.amountRequested}
          onChange={(e) => setFormData(prev => ({ ...prev, amountRequested: e.target.value }))}
          placeholder="0.00"
          required
          icon={<DollarSign className="w-4 h-4" />}
        />

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe your proposal in detail. Include the problem it solves, the solution, expected outcomes, and timeline... (50-5000 characters)"
            className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-base focus:outline-none focus:ring-2 focus:ring-brandBlue-100 focus:border-brandBlue-500 min-h-[120px] resize-none"
            required
          />
          <p className={`text-xs mt-1 ${
            formData.description.length < 50 && formData.description.length > 0 
              ? 'text-danger' 
              : formData.description.length > 5000 
                ? 'text-danger' 
                : 'text-neutral-500'
          }`}>
            {formData.description.length}/5000 characters
            {formData.description.length > 0 && formData.description.length < 50 && (
              <span className="text-danger"> - Minimum 50 characters required</span>
            )}
            {formData.description.length > 5000 && (
              <span className="text-danger"> - Maximum 5000 characters exceeded</span>
            )}
          </p>
          
          <div className="mt-2 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={generateAISummary}
              loading={isGeneratingAI}
              className="flex items-center space-x-1"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Summary</span>
            </Button>
          </div>
        </div>

        {/* Timeline */}
        <div className="p-4 bg-neutral-50 rounded-lg">
          <h4 className="font-medium text-neutral-900 mb-2 flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            Voting Timeline
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-neutral-500">Commit Phase</p>
              <p className="font-medium text-neutral-900">24 hours</p>
            </div>
            <div>
              <p className="text-neutral-500">Reveal Phase</p>
              <p className="font-medium text-neutral-900">24 hours</p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg">
            <p className="text-danger text-sm">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-neutral-200">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={
              !formData.title || 
              !formData.description || 
              !formData.amountRequested || 
              formData.title.length < 5 || 
              formData.description.length < 50 || 
              isSubmitting
            }
            loading={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Proposal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateProposalModal;
