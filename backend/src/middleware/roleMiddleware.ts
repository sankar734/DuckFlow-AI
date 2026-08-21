import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware';
import { UserRole } from '../models/User';
import { sendError } from '../utils/responseFormatter';

export const requireRole = (roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      sendError(res, 'FORBIDDEN', 'You do not have permission to perform this action', 403);
      return;
    }
    next();
  };
};

export const requireAdmin = requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
