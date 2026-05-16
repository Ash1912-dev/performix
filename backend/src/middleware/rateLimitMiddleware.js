/**
 * Simple in-memory rate limiter.
 * Max 100 requests per IP per 15-minute window.
 * Skips /api/auth/login and /api/auth/register.
 */
const ipMap = new Map();
const MAX_REQUESTS = 1000;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const SKIP_PATHS = ['/api/auth/login', '/api/auth/register'];

const rateLimiter = (req, res, next) => {
  if (SKIP_PATHS.includes(req.path)) {
    return next();
  }

  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  const entry = ipMap.get(ip);

  if (!entry || now > entry.resetAt) {
    ipMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  if (entry.count >= MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests, please slow down',
    });
  }

  entry.count += 1;
  return next();
};

module.exports = rateLimiter;
