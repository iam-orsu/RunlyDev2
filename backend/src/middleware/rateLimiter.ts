import rateLimit from 'express-rate-limit';

// 30 submissions per minute per IP
export const submissionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many submissions, please try again later.',
  },
});
