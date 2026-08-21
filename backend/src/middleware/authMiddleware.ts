import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { User, IUser } from '../models/User';
import { sendError } from '../utils/responseFormatter';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
  tokenPayload?: TokenPayload;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'UNAUTHORIZED', 'Access token is missing or invalid', 401);
      return;
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    const user = await User.findById(payload.userId);
    if (!user || !user.isActive || user.isBlocked) {
      sendError(res, 'UNAUTHORIZED', 'User account is inactive or blocked', 401);
      return;
    }

    req.user = user;
    req.tokenPayload = payload;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      sendError(res, 'TOKEN_EXPIRED', 'Access token has expired', 401);
      return;
    }
    sendError(res, 'UNAUTHORIZED', 'Invalid access token', 401);
  }
};
