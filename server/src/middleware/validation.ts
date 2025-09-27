import { Request, Response, NextFunction } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';
import { logger } from '../utils/logger.ts';

// Handle validation errors
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    logger.warn('Validation errors:', errors.array());
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  
  next();
};

// Member validation rules
export const validateMemberUpdate = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Username must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters'),
  body('socialLinks.twitter')
    .optional()
    .isURL()
    .withMessage('Invalid Twitter URL'),
  body('socialLinks.github')
    .optional()
    .isURL()
    .withMessage('Invalid GitHub URL'),
  body('socialLinks.discord')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Discord handle must be less than 50 characters'),
  handleValidationErrors
];

// User validation rules
export const validateUserRegistration = [
  body('message')
    .notEmpty()
    .withMessage('Message is required'),
  body('signature')
    .isLength({ min: 130, max: 132 })
    .withMessage('Invalid signature format'),
  body('address')
    .isEthereumAddress()
    .withMessage('Invalid Ethereum address'),
  handleValidationErrors
];

// Proposal validation rules
export const validateProposalCreation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 50, max: 5000 })
    .withMessage('Description must be between 50 and 5000 characters'),
  body('amountRequested')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('category')
    .isIn(['treasury', 'governance', 'grants', 'infrastructure', 'marketing'])
    .withMessage('Invalid category'),
  body('commitEndTime')
    .isISO8601()
    .withMessage('Invalid commit end time format'),
  body('revealEndTime')
    .isISO8601()
    .withMessage('Invalid reveal end time format')
    .custom((value, { req }) => {
      const commitEndTime = new Date(req.body.commitEndTime);
      const revealEndTime = new Date(value);
      
      if (revealEndTime <= commitEndTime) {
        throw new Error('Reveal end time must be after commit end time');
      }
      
      return true;
    }),
  handleValidationErrors
];

// Vote validation rules
export const validateVoteCommit = [
  body('commitHash')
    .matches(/^0x[a-fA-F0-9]{64}$/)
    .withMessage('Invalid commit hash format'),
  body('proposalId')
    .isMongoId()
    .withMessage('Invalid proposal ID'),
  handleValidationErrors
];

export const validateVoteReveal = [
  body('vote')
    .isIn(['yes', 'no'])
    .withMessage('Vote must be either "yes" or "no"'),
  body('salt')
    .isLength({ min: 1, max: 100 })
    .withMessage('Salt must be between 1 and 100 characters'),
  body('proposalId')
    .isMongoId()
    .withMessage('Invalid proposal ID'),
  handleValidationErrors
];

// Treasury transaction validation rules
export const validateTreasuryTransaction = [
  body('type')
    .isIn(['deposit', 'withdrawal', 'transfer', 'investment'])
    .withMessage('Invalid transaction type'),
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('to')
    .optional()
    .isEthereumAddress()
    .withMessage('Invalid recipient address'),
  handleValidationErrors
];

// Pagination validation
export const validatePagination = [
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

// AI service validation
export const validateAISummary = [
  body('content')
    .trim()
    .isLength({ min: 50, max: 10000 })
    .withMessage('Content must be between 50 and 10000 characters'),
  handleValidationErrors
];

// Custom validation for proposal timing
export const validateProposalTiming = (req: Request, res: Response, next: NextFunction) => {
  const { commitEndTime, revealEndTime } = req.body;
  
  const commitEnd = new Date(commitEndTime);
  const revealEnd = new Date(revealEndTime);
  const now = new Date();
  
  // Check if times are in the future
  if (commitEnd <= now) {
    return res.status(400).json({
      success: false,
      message: 'Commit end time must be in the future'
    });
  }
  
  if (revealEnd <= commitEnd) {
    return res.status(400).json({
      success: false,
      message: 'Reveal end time must be after commit end time'
    });
  }
  
  // Check if times are reasonable (not too far in the future)
  const maxFuture = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
  
  if (revealEnd > maxFuture) {
    return res.status(400).json({
      success: false,
      message: 'Reveal end time cannot be more than 1 year in the future'
    });
  }
  
  next();
};