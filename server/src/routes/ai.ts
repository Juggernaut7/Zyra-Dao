import express from 'express';
import { body, validationResult } from 'express-validator';
import { aiService } from '../services/aiService.ts';
import { verifyToken } from '../middleware/auth.ts';
import { aiLimiter } from '../middleware/rateLimiting.ts';
import { logger } from '../utils/logger.ts';
import { ResponseHelper } from '../utils/response.ts';
import { StatusCodes } from 'http-status-codes';
import { summarizeProposalSchema, treasuryInsightsSchema, analyzeImpactSchema } from '../validation/ai.validation.ts';

const router = express.Router();

// Apply rate limiting to all AI routes
router.use(aiLimiter);

/**
 * @route POST /api/ai/summarize
 * @desc Summarize a proposal using AI
 * @access Private
 */
router.post('/summarize', 
  verifyToken,
  [
    body('text')
      .isString()
      .notEmpty()
      .isLength({ min: 10, max: 10000 })
      .withMessage('Text must be between 10 and 10000 characters')
  ],
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.badRequest(res, 'Validation failed', errors.array());
      }

      const { text } = req.body;
      logger.info(`AI summarize request from user ${req.user?.address}`);

      const summary = await aiService.summarizeProposal(text);

      return ResponseHelper.success(res, summary, 'Proposal summarized successfully');
    } catch (error) {
      logger.error('AI summarize error:', error);
      return ResponseHelper.internalError(res, 'Failed to generate proposal summary', error);
    }
  }
);

/**
 * @route POST /api/ai/treasury-insights
 * @desc Generate treasury insights using AI
 * @access Private
 */
router.post('/treasury-insights',
  verifyToken,
  [
    body('data.currentValue')
      .isNumeric()
      .withMessage('Current value must be a number'),
    body('data.timeHorizon')
      .optional()
      .isString()
      .withMessage('Time horizon must be a string')
  ],
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.badRequest(res, 'Validation failed', errors.array());
      }

      const { currentValue, timeHorizon = '6 months' } = req.body.data;
      logger.info(`AI treasury insights request from user ${req.user?.address}`);

      const insights = await aiService.generateTreasuryInsights(currentValue, timeHorizon);

      return ResponseHelper.success(res, insights, 'Treasury insights generated successfully');
    } catch (error) {
      logger.error('AI treasury insights error:', error);
      return ResponseHelper.internalError(res, 'Failed to generate treasury insights', error);
    }
  }
);

/**
 * @route POST /api/ai/analyze-impact
 * @desc Analyze proposal impact on treasury
 * @access Private
 */
router.post('/analyze-impact',
  verifyToken,
  [
    body('proposalText')
      .isString()
      .notEmpty()
      .isLength({ min: 10, max: 10000 })
      .withMessage('Proposal text must be between 10 and 10000 characters'),
    body('treasuryValue')
      .isNumeric()
      .withMessage('Treasury value must be a number')
  ],
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.badRequest(res, 'Validation failed', errors.array());
      }

      const { proposalText, treasuryValue } = req.body;
      logger.info(`AI impact analysis request from user ${req.user?.address}`);

      // For now, use the summarizeProposal method with treasury context
      const prompt = `Analyze the impact of this DAO proposal on a treasury worth $${treasuryValue.toLocaleString()}:

Proposal: "${proposalText}"

Provide:
1. Impact analysis (how it affects the treasury)
2. Risk assessment (potential risks and mitigation)
3. Recommendation (approve/reject/modify with reasoning)

Format as JSON with keys: impact, riskAssessment, recommendation`;

      const analysis = await aiService.summarizeProposal(prompt);

      // Transform the response to match expected format
      const result = {
        impact: analysis.summary,
        riskAssessment: `Risk level: ${analysis.riskLevel}. ${analysis.keyPoints.join('. ')}`,
        recommendation: analysis.recommendation
      };

      return ResponseHelper.success(res, result, 'Proposal impact analyzed successfully');
    } catch (error) {
      logger.error('AI impact analysis error:', error);
      return ResponseHelper.internalError(res, 'Failed to analyze proposal impact', error);
    }
  }
);

export default router;
