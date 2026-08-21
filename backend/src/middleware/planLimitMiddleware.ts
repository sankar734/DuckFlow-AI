import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware';
import { sendError } from '../utils/responseFormatter';

export const checkAICredits = (requiredCredits: number = 1) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
      return;
    }

    const availableCredits = req.user.aiCredits - req.user.aiCreditsUsed;
    if (availableCredits < requiredCredits) {
      sendError(
        res,
        'AI_CREDITS_EXHAUSTED',
        `Insufficient AI credits. You need ${requiredCredits} credits, but have ${availableCredits} remaining. Please upgrade your plan.`,
        402,
        { availableCredits, requiredCredits }
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
