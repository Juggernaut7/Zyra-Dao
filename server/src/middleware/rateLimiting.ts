import rateLimit from 'express-rate-limit';
import { config } from '../config/index.ts';

// General API rate limiting
export const generalLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs, // 15 minutes
  max: config.rateLimitMaxRequests, // 100 requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  }
});

// Strict rate limiting for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

// Rate limiting for voting endpoints
export const votingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 votes per minute
  message: {
    success: false,
    message: 'Too many voting attempts, please slow down'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting for AI endpoints
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 AI requests per minute
  message: {
    success: false,
    message: 'Too many AI requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting for proposal creation
export const proposalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 proposals per hour
  message: {
    success: false,
    message: 'Too many proposal submissions, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});
