import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';
import { sendError } from '../utils/responseFormatter';

export class AppError extends Error {
  statusCode: number;
  errorCode: string;
  details?: any;

  constructor(message: string, statusCode: number = 400, errorCode: string = 'BAD_REQUEST', details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error(`Error: ${err.message}`, { stack: err.stack, path: req.path, method: req.method });

  if (err instanceof AppError) {
    sendError(res, err.errorCode, err.message, err.statusCode, err.details);
    return;
  }

  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
    sendError(res, 'VALIDATION_ERROR', 'Input validation failed', 400, formattedErrors);
    return;
  }

  if (err.name === 'CastError') {
    sendError(res, 'INVALID_ID', `Invalid ID format for field ${err.path}`, 400);
    return;
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    sendError(res, 'DUPLICATE_KEY', `An entry with this ${field} already exists.`, 409);
    return;
  }

  sendError(res, 'INTERNAL_SERVER_ERROR', process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred' : err.message, 500);
};
