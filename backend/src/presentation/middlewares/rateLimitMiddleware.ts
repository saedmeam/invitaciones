import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../shared/errors/AppError';

interface Bucket {
  count: number;
  resetAt: number;
}

export function createRateLimiter(maxRequests: number, windowMs: number) {
  const buckets = new Map<string, Bucket>();

  return (req: Request, _res: Response, next: NextFunction) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const existing = buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    existing.count += 1;
    if (existing.count > maxRequests) {
      return next(
        new AppError('Demasiados intentos, espera un momento antes de reintentar', 429, 'RATE_LIMIT')
      );
    }

    return next();
  };
}
