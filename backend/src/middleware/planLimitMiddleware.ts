import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware';
import { sendError } from '../utils/responseFormatter';

export const checkAICredits = (requiredCredits: number = 1) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
      return;
    }

    // Dynamic daily refill check
    const now = new Date();
    const lastRefill = req.user.lastCreditRefillAt ? new Date(req.user.lastCreditRefillAt) : new Date(req.user.createdAt || now);
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const elapsedMs = now.getTime() - lastRefill.getTime();
    const isNewDay =
      now.getUTCDate() !== lastRefill.getUTCDate() ||
      now.getUTCMonth() !== lastRefill.getUTCMonth() ||
      now.getUTCFullYear() !== lastRefill.getUTCFullYear();

    if (elapsedMs >= ONE_DAY_MS || (elapsedMs > 60 * 1000 && isNewDay)) {
      const dailyAllocation =
        req.user.dailyCreditsAllocation ||
        (req.user.planId === 'pro' ? 250 : req.user.planId === 'business' ? 1000 : 50);
      req.user.aiCredits = Math.max(req.user.aiCredits || 0, dailyAllocation);
      req.user.aiCreditsUsed = 0;
      req.user.lastCreditRefillAt = now;
      await req.user.save();
    }

    const availableCredits = Math.max(0, req.user.aiCredits - req.user.aiCreditsUsed);
    if (availableCredits < requiredCredits) {
      const currentRefill = req.user.lastCreditRefillAt ? new Date(req.user.lastCreditRefillAt) : now;
      const nextRefillAt = new Date(currentRefill.getTime() + ONE_DAY_MS);
      const refillHoursRemaining = Math.max(1, Math.ceil((nextRefillAt.getTime() - now.getTime()) / (1000 * 3600)));

      sendError(
        res,
        'AI_CREDITS_EXHAUSTED',
        `Insufficient AI credits. You need ${requiredCredits} credits, but have ${availableCredits} remaining. Your daily allowance will refill in ${refillHoursRemaining}h, or you can upgrade to Pro.`,
        402,
        { availableCredits, requiredCredits, nextRefillAt, refillHoursRemaining }
      );
      return;
    }

    next();
  };
};

export const checkStorageQuota = (incomingBytes: number = 0) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
      return;
    }

    const projectedUsage = req.user.storageUsed + incomingBytes;
    if (projectedUsage > req.user.storageLimit) {
      sendError(
        res,
        'STORAGE_LIMIT_REACHED',
        'Storage limit reached. Please delete some files or upgrade your plan.',
        402,
        {
          used: req.user.storageUsed,
          limit: req.user.storageLimit,
        }
      );
      return;
    }

    next();
  };
};
