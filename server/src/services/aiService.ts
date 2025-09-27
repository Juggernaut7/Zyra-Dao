import axios from 'axios';
import { config } from '../config/index.ts';
import { AIProposalSummary, AITreasuryInsight } from '../types/index.ts';
import { logger } from '../utils/logger.ts';

class AIService {
  private baseURL = 'https://router.huggingface.co/v1';
  private apiKey: string;

  constructor() {
    this.apiKey = config.hfToken;
    
    if (!this.apiKey || this.apiKey === 'hf_your_hugging_face_token') {
      logger.warn('AI Service: No Hugging Face token provided. Using mock responses.');
    } else {
      logger.info('AI Service: Hugging Face token found. Using real AI responses.');
    }
  }

  /**
   * Summarize a proposal using DeepSeek model
   */
  async summarizeProposal(proposalText: string): Promise<AIProposalSummary> {
    if (!this.apiKey || this.apiKey === 'hf_your_hugging_face_token') {
      return this.getMockProposalSummary(proposalText);
    }

    try {
      const prompt = `Analyze this DAO proposal and provide a comprehensive summary:

Proposal: "${proposalText}"

Please provide:
1. A clear TL;DR summary (2-3 sentences)
2. Key points (bullet list of 3-5 main points)
3. Recommendation: approve, reject, or modify
4. Confidence level (0-100)
5. Risk level: low, medium, or high

Format your response as JSON with these exact keys: summary, keyPoints, recommendation, confidence, riskLevel`;

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'deepseek-ai/DeepSeek-R1:novita',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const aiResponse = response.data.choices[0]?.message?.content;
      
      if (!aiResponse) {
        throw new Error('No response from AI service');
      }

      // Parse the JSON response
      try {
        const parsed = JSON.parse(aiResponse);
        return {
          summary: parsed.summary || 'Unable to generate summary',
          keyPoints: parsed.keyPoints || [],
          recommendation: parsed.recommendation || 'modify',
          confidence: parsed.confidence || 50,
          riskLevel: parsed.riskLevel || 'medium'
        };
      } catch (parseError) {
        logger.error('AI response JSON parsing failed:', parseError);
        return {
          summary: aiResponse,
          keyPoints: ['Analysis completed'],
          recommendation: 'modify',
          confidence: 60,
          riskLevel: 'medium'
        };
      }
    } catch (error) {
      logger.error('AI summarization error:', error);
      return this.getMockProposalSummary(proposalText);
    }
  }

  /**
   * Generate treasury simulation insights
   */
  async generateTreasuryInsights(currentValue: number, timeHorizon: string = '6 months'): Promise<AITreasuryInsight[]> {
    if (!this.apiKey || this.apiKey === 'hf_your_hugging_face_token') {
      return this.getMockTreasuryInsights(currentValue);
    }

    try {
      const prompt = `Analyze treasury management scenarios for a DAO with current value of $${currentValue.toLocaleString()}:

Time horizon: ${timeHorizon}

Provide 3 scenarios:
1. Conservative (low risk, stable growth)
2. Moderate (balanced risk/reward)
3. Aggressive (high risk, high potential returns)

For each scenario, provide:
- Projected value
- Risk level (low/medium/high)
- Confidence (0-100)
- Brief reasoning

Format as JSON array with keys: scenario, projectedValue, riskLevel, confidence, reasoning`;

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'deepseek-ai/DeepSeek-R1:novita',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.8,
          max_tokens: 1200
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const aiResponse = response.data.choices[0]?.message?.content;
      
      if (!aiResponse) {
        throw new Error('No response from AI service');
      }

      try {
        const parsed = JSON.parse(aiResponse);
        return Array.isArray(parsed) ? parsed : [];
      } catch (parseError) {
        logger.error('AI treasury JSON parsing failed:', parseError);
        return this.getMockTreasuryInsights(currentValue);
      }
    } catch (error) {
      logger.error('AI treasury insights error:', error);
      return this.getMockTreasuryInsights(currentValue);
    }
  }

  /**
   * Mock proposal summary for demo purposes
   */
  private getMockProposalSummary(proposalText: string): AIProposalSummary {
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
      riskLevel
    };
  }

  /**
   * Mock treasury insights for demo purposes
   */
  private getMockTreasuryInsights(currentValue: number): AITreasuryInsight[] {
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

export const aiService = new AIService();
export default aiService;
