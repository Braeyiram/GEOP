import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

// Interface for rate limit rule
interface RateLimitRule {
  windowMs: number;  // Time window in milliseconds
  max: number;       // Maximum requests allowed in the window
  message: string;   // Error message to return
}

// In-memory storage for rate limiting
class RateLimitStore {
  private store: Map<string, { count: number, resetTime: number }>;
  
  constructor() {
    this.store = new Map();
    
    // Cleanup expired entries every minute
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.store) {
        if (value.resetTime < now) {
          this.store.delete(key);
        }
      }
    }, 60 * 1000);
  }
  
  increment(key: string, windowMs: number): { count: number, resetTime: number } {
    const now = Date.now();
    const record = this.store.get(key);
    
    if (!record || record.resetTime < now) {
      // Key doesn't exist or has expired, create new entry
      const resetTime = now + windowMs;
      this.store.set(key, { count: 1, resetTime });
      return { count: 1, resetTime };
    } else {
      // Key exists and is still valid, increment counter
      record.count++;
      return record;
    }
  }
}

const rateLimitStore = new RateLimitStore();

// Default rate limit rules
const defaultRules: Record<string, RateLimitRule> = {
  api: {
    windowMs: 60 * 1000, // 1 minute
    max: 100,            // 100 requests per minute
    message: 'Too many requests from this IP, please try again after a minute'
  },
  email: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 1000,              // 1000 emails per hour
    message: 'Email sending rate limit exceeded'
  },
  tracking: {
    windowMs: 60 * 1000, // 1 minute
    max: 500,            // 500 tracking events per minute
    message: 'Too many tracking events'
  }
};

// Rate limiter middleware factory function
export function createRateLimiter(type: keyof typeof defaultRules = 'api') {
  const rule = defaultRules[type];
  
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${type}:${req.ip}`;
    const { count, resetTime } = rateLimitStore.increment(key, rule.windowMs);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', String(rule.max));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, rule.max - count)));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetTime / 1000)));
    
    // Track system metrics for rate limiting
    storage.createSystemMetric({
      metricName: `rate_limit_${type}`,
      metricValue: String(count),
      region: 'Global'
    }).catch(console.error);
    
    if (count > rule.max) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: rule.message
      });
    }
    
    next();
  };
}

// Apply different rate limits for different endpoints
export const apiRateLimiter = createRateLimiter('api');
export const emailRateLimiter = createRateLimiter('email');
export const trackingRateLimiter = createRateLimiter('tracking');
