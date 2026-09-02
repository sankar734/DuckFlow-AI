import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { registerSchema, loginSchema, otpVerifySchema, forgotPasswordSchema } from '../schemas';
import { sendSuccess } from '../utils/responseFormatter';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = registerSchema.parse(req.body);
      const result = await authService.register(validated);
      sendSuccess(res, result, 'Registration successful', 201);
    } catch (error) {
      next(error);
    }
  }

  async sendRegisterOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, name, password } = req.body;
      const result = await authService.sendRegisterOTP({ email, name, password });
      sendSuccess(res, result, 'Verification code sent to your email');
    } catch (error) {
      next(error);
    }
  }

  async verifyRegisterOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp, name, password } = req.body;
      const result = await authService.registerWithOTP({ email, otp, name, password });
      sendSuccess(res, result, 'Account verified and registered successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = loginSchema.parse(req.body);
      const result = await authService.login(validated);
      sendSuccess(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  async checkEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, mode } = req.body;
      const result = await authService.checkEmail(email, mode);
      sendSuccess(res, result, 'Email status checked');
    } catch (error) {
      next(error);
    }
  }

  async googleLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.googleLogin(req.body);
      sendSuccess(res, result, 'Google sign-in successful');
    } catch (error) {
      next(error);
    }
  }

  async sendOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);
      const result = await authService.sendOTP(email);
      sendSuccess(res, result, 'OTP sent successfully');
    } catch (error) {
      next(error);
    }
  }

  async verifyOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp } = otpVerifySchema.parse(req.body);
      const result = await authService.verifyOTP(email, otp);
      sendSuccess(res, result, 'OTP verified successfully');
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp, newPassword } = req.body;
      const result = await authService.resetPassword({ email, otp, newPassword });
      sendSuccess(res, result, 'Password reset successful');
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { email, otp, currentPassword, newPassword } = req.body;
      const userEmail = email || req.user?.email;
      const userId = req.user?.id || req.user?._id;
      const result = await authService.changePassword({
        userId: userId ? String(userId) : undefined,
        email: userEmail,
        otp,
        currentPassword,
        newPassword,
      });
      sendSuccess(res, result, 'Password updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      sendSuccess(res, result, 'Token refreshed');
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, { user: req.user }, 'Current user profile');
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
