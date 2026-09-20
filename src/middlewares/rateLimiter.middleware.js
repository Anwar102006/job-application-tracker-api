import rateLimit from 'express-rate-limit';
import { ApiError } from '../utils/ApiError.js';

export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 100,
  message = 'Too many requests from this IP, please try again later',
  skip,
} = {}) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
      next(new ApiError(429, message));
    },
    ...(skip ? { skip } : {}),
  });
};

export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message:
    'Too many authentication attempts from this IP, please try again after 15 minutes',
  skip: (req) =>
    process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit'],
});

export const generalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  skip: (req) =>
    process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit'],
});

