import { body } from 'express-validator';

export const summarizeProposalSchema = [
  body('text')
    .isString()
    .isLength({ min: 10, max: 10000 })
    .withMessage('Proposal text must be between 10 and 10,000 characters')
];

export const treasuryInsightsSchema = [
  body('data.currentValue')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Current value must be a positive number'),
  body('data.timeHorizon')
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Time horizon must be between 1 and 50 characters')
];

export const analyzeImpactSchema = [
  body('proposalText')
    .isString()
    .isLength({ min: 10, max: 10000 })
    .withMessage('Proposal text must be between 10 and 10,000 characters'),
  body('treasuryValue')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Treasury value must be a positive number')
];
