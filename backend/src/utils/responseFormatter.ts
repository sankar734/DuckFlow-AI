import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    [key: string]: any;
  };
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message: string = 'Operation completed successfully',
  statusCode: number = 200,
  meta?: ApiResponse['meta']
) => {
  const responsePayload: ApiResponse<T> = {
    success: true,
    data,
    message,
    ...(meta ? { meta } : {}),
  };
  return res.status(statusCode).json(responsePayload);
};

export const sendError = (
  res: Response,
  errorCode: string,
  message: string,
  statusCode: number = 400,
  details?: any
) => {
  const responsePayload: ApiResponse = {
    success: false,
    error: {
      code: errorCode,
      message,
      ...(details ? { details } : {}),
    },
  };
  return res.status(statusCode).json(responsePayload);
};
