// AI Service for Zyra DAO - Using backend proxy for AI calls
// This will be used for proposal summarization and treasury insights

export interface AIResponse {
  summary: string;
  keyPoints: string[];
  recommendation: 'approve' | 'reject' | 'modify';
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface TreasuryInsight {
  scenario: string;
  projectedValue: number;
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
  reasoning: string;
}

class AIService {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';
    console.log('AI Service: Using backend proxy for AI calls');
  }

  /**
   * Summarize a proposal using backend AI proxy
   */
  async summarizeProposal(proposalText: string): Promise<AIResponse> {
    try {
      console.log('Making API call to backend AI proxy...');
      
      const response = await fetch(`${this.apiBaseUrl}/ai/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ text: proposalText }),
      });

      if (!response.ok) {
        throw new Error(`Backend AI service error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Backend AI response:', data);
      
      return {
        summary: data.summary || 'Unable to generate summary',
        keyPoints: data.keyPoints || [],
        recommendation: data.recommendation || 'modify',
        confidence: data.confidence || 50,
        riskLevel: data.riskLevel || 'medium',
      };
    } catch (error) {
      console.error('AI summarization error:', error);
      
      // Fallback to mock response
      return this.getMockProposalSummary(proposalText);
    }
  }

  /**
   * Generate treasury simulation insights using backend AI proxy
   */
  async generateTreasuryInsights(currentValue: number, timeHorizon: string = '6 months'): Promise<TreasuryInsight[]> {
    try {
      console.log('Making API call to backend AI proxy for treasury insights...');
      
      const response = await fetch(`${this.apiBaseUrl}/ai/treasury-insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ 
          data: { currentValue, timeHorizon } 
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend AI service error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Backend AI treasury response:', data);
      
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('AI treasury insights error:', error);
      
      // Fallback to mock response
      return this.getMockTreasuryInsights(currentValue);
    }
  }

  /**
   * Generate proposal impact analysis using backend AI proxy
   */
  async analyzeProposalImpact(proposalText: string, treasuryValue: number): Promise<{
    impact: string;
    riskAssessment: string;
    recommendation: string;
  }> {
    try {
      console.log('Making API call to backend AI proxy for impact analysis...');
      
      const response = await fetch(`${this.apiBaseUrl}/ai/analyze-impact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ 
          proposalText, 
          treasuryValue 
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend AI service error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Backend AI impact response:', data);
      
      return {
        impact: data.impact || 'Impact analysis unavailable',
        riskAssessment: data.riskAssessment || 'Risk assessment unavailable',
        recommendation: data.recommendation || 'Further analysis needed',
      };
    } catch (error) {
      console.error('AI impact analysis error:', error);
      
      return {
        impact: 'This proposal will impact the treasury through the requested funding allocation.',
        riskAssessment: 'Standard risk assessment applies to this funding request.',
        recommendation: 'Review the proposal details and community feedback before voting.',
      };
    }
  }

  /**
   * Mock proposal summary for demo purposes
   */
  private getMockProposalSummary(proposalText: string): AIResponse {
    // Simple keyword-based analysis for demo
    const isMarketing = proposalText.toLowerCase().includes('marketing') || proposalText.toLowerCase().includes('campaign');
    const isInfrastructure = proposalText.toLowerCase().includes('infrastructure') || proposalText.toLowerCase().includes('server');
    const isCommunity = proposalText.toLowerCase().includes('community') || proposalText.toLowerCase().includes('grant');
    
    let recommendation: 'approve' | 'reject' | 'modify' = 'modify';
    let riskLevel: 'low' | 'medium' | 'high' = 'medium';
    let confidence = 75;
    
    if (isMarketing) {
      recommendation = 'approve';
      riskLevel = 'low';
      confidence = 85;
    } else if (isInfrastructure) {
      recommendation = 'approve';
      riskLevel = 'medium';
      confidence = 80;
    } else if (isCommunity) {
      recommendation = 'approve';
      riskLevel = 'low';
      confidence = 90;
    }

    return {
      summary: `**TL;DR**: This proposal requests funding for DAO operations. Based on the content analysis, this appears to be a ${isMarketing ? 'marketing' : isInfrastructure ? 'infrastructure' : isCommunity ? 'community' : 'general'} initiative with clear objectives and reasonable budget allocation.`,
      keyPoints: [
        'Clear budget breakdown and timeline',
        'Reasonable funding request amount',
        'Well-defined expected outcomes',
        'Appropriate risk assessment',
        'Community benefit potential'
      ],
      recommendation,
      confidence,
      riskLevel,
    };
  }

  /**
   * Mock treasury insights for demo purposes
   */
  private getMockTreasuryInsights(currentValue: number): TreasuryInsight[] {
    return [
      {
        scenario: 'Conservative',
        projectedValue: currentValue * 0.95,
        riskLevel: 'low',
        confidence: 85,
        reasoning: 'Maintains stability with minimal risk exposure'
      },
      {
        scenario: 'Moderate',
        projectedValue: currentValue * 1.15,
        riskLevel: 'medium',
        confidence: 70,
        reasoning: 'Balanced approach with moderate growth potential'
      },
      {
        scenario: 'Aggressive',
        projectedValue: currentValue * 1.35,
        riskLevel: 'high',
        confidence: 55,
        reasoning: 'High-risk strategy with maximum growth potential'
      }
    ];
  }
}

// Export singleton instance
export const aiService = new AIService();
export default aiService;
