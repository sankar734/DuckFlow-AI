import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', authLimiter, (req, res, next) => authController.register(req, res, next));
router.post('/send-register-otp', authLimiter, (req, res, next) => authController.sendRegisterOTP(req, res, next));
router.post('/verify-register-otp', authLimiter, (req, res, next) => authController.verifyRegisterOTP(req, res, next));
router.post('/login', authLimiter, (req, res, next) => authController.login(req, res, next));
router.post('/check-email', (req, res, next) => authController.checkEmail(req, res, next));
router.post('/google', authLimiter, (req, res, next) => authController.googleLogin(req, res, next));

// Generic OTP and Password Reset Endpoints
router.post('/send-otp', authLimiter, (req, res, next) => authController.sendOTP(req, res, next));
router.post('/resend-otp', authLimiter, (req, res, next) => authController.sendOTP(req, res, next));
router.post('/verify-otp', authLimiter, (req, res, next) => authController.verifyOTP(req, res, next));
router.post('/forgot-password', authLimiter, (req, res, next) => authController.sendOTP(req, res, next));
router.post('/reset-password', authLimiter, (req, res, next) => authController.resetPassword(req, res, next));
router.post('/change-password', authLimiter, (req, res, next) => authController.changePassword(req, res, next));

// Session & Profile
router.post('/refresh', (req, res, next) => authController.refreshToken(req, res, next));
router.post('/refresh-token', (req, res, next) => authController.refreshToken(req, res, next));
router.get('/me', authenticate, (req, res, next) => authController.getMe(req, res, next));

export default router;
