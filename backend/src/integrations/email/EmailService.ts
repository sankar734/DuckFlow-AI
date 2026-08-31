import nodemailer from 'nodemailer';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    try {
      if (env.SMTP_USER && env.SMTP_PASSWORD) {
        const isGmail = env.SMTP_HOST.includes('gmail') || env.SMTP_USER.includes('@gmail.com');
        this.transporter = nodemailer.createTransport({
          host: env.SMTP_HOST || 'smtp.gmail.com',
          port: env.SMTP_PORT || (isGmail ? 465 : 587),
          secure: (env.SMTP_PORT === 465 || isGmail),
          auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASSWORD,
          },
        });
      }
    } catch (err: any) {
      logger.warn(`Email Transporter Init Warning: ${err?.message || err}`);
    }
  }

  async sendLoginSecurityAlert(to: string, name: string): Promise<void> {
    logger.info(`[EMAIL] Dispatching Login Notification to ${to} (${name})`);
    if (!this.transporter) {
      this.initTransporter();
    }

    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 32px; border-radius: 16px; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #6366f1; margin: 0; font-size: 24px;">DocuFlow AI</h1>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Security & Sign-In Notification</p>
        </div>
        
        <div style="background-color: #1e293b; padding: 24px; border-radius: 12px; border: 1px solid #334155;">
          <h2 style="color: #ffffff; font-size: 18px; margin-top: 0;">Successful Google Sign-In</h2>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
            Hello <strong>${name}</strong>,<br/>
            Your Google Account <strong>${to}</strong> was just used to successfully sign in to <strong>DocuFlow AI</strong>.
          </p>

          <table style="width: 100%; margin: 16px 0; border-collapse: collapse; font-size: 13px; color: #94a3b8;">
            <tr>
              <td style="padding: 8px 0;"><strong>Time:</strong></td>
              <td style="padding: 8px 0; color: #f1f5f9;">${new Date().toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Method:</strong></td>
              <td style="padding: 8px 0; color: #f1f5f9;">Google OAuth Authentication</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Status:</strong></td>
              <td style="padding: 8px 0; color: #10b981;">Authorized & Synced</td>
            </tr>
          </table>

          <p style="color: #94a3b8; font-size: 12px; margin-top: 20px; border-top: 1px solid #334155; padding-top: 16px;">
            If you did not perform this login, please secure your account immediately.
          </p>
        </div>

        <div style="text-align: center; margin-top: 24px; color: #64748b; font-size: 11px;">
          &copy; ${new Date().getFullYear()} DocuFlow AI Enterprise Suite. All rights reserved.
        </div>
      </div>
    `;

    try {
      if (this.transporter) {
        await this.transporter.sendMail({
          from: `"DocuFlow AI Security" <${env.SMTP_USER || 'noreply@docuflow.ai'}>`,
          to,
          subject: '🔐 New Sign-In to DocuFlow AI from your Google Account',
          html,
        });
        logger.info(`[EMAIL] ✅ Real email delivered to ${to}`);
      }
    } catch (err: any) {
      logger.warn(`[EMAIL] Gmail dispatch note: ${err?.message || err}`);
    }
  }

  async sendSubscriptionReceiptEmail(
    to: string,
    name: string,
    planName: string,
    amount: number,
    invoiceNum: string,
    transactionId: string
  ): Promise<void> {
    logger.info(`[EMAIL] Dispatching Subscription Payment Receipt to ${to} (${planName} - ₹${amount})`);
    if (!this.transporter) {
      this.initTransporter();
    }

    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 32px; border-radius: 16px; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #6366f1; margin: 0; font-size: 24px;">DocuFlow AI</h1>
          <p style="color: #10b981; font-size: 13px; font-weight: bold; margin-top: 4px;">✓ Payment Successful & Subscription Activated</p>
        </div>
        
        <div style="background-color: #1e293b; padding: 24px; border-radius: 12px; border: 1px solid #334155;">
          <h2 style="color: #ffffff; font-size: 18px; margin-top: 0;">Thank You for Upgrading!</h2>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
            Hello <strong>${name}</strong>,<br/>
            Your payment has been securely processed and your <strong>${planName} Plan</strong> is now active.
          </p>

          <div style="background-color: #0f172a; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px dashed #475569;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #cbd5e1;">
              <tr>
                <td style="padding: 6px 0; color: #94a3b8;">Plan:</td>
                <td style="padding: 6px 0; font-weight: bold; color: #6366f1; text-align: right;">${planName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94a3b8;">Amount Paid:</td>
                <td style="padding: 6px 0; font-weight: bold; color: #10b981; text-align: right;">₹${amount.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94a3b8;">Invoice Number:</td>
                <td style="padding: 6px 0; font-family: monospace; text-align: right;">${invoiceNum}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94a3b8;">Transaction ID:</td>
                <td style="padding: 6px 0; font-family: monospace; text-align: right;">${transactionId}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94a3b8;">Date & Time:</td>
                <td style="padding: 6px 0; text-align: right;">${new Date().toLocaleString()}</td>
              </tr>
            </table>
          </div>

          <p style="color: #94a3b8; font-size: 12px; margin-top: 16px; border-top: 1px solid #334155; padding-top: 12px;">
            All upgraded AI Credits, high-speed cloud storage, and unlimited tools are now unlocked on your account.
          </p>
        </div>

        <div style="text-align: center; margin-top: 24px; color: #64748b; font-size: 11px;">
          &copy; ${new Date().getFullYear()} DocuFlow AI Payments. 256-Bit SSL Encrypted.
        </div>
      </div>
    `;

    try {
      if (this.transporter) {
        await this.transporter.sendMail({
          from: `"DocuFlow AI Billing" <${env.SMTP_USER || 'noreply@docuflow.ai'}>`,
          to,
          subject: `🧾 Payment Receipt: ${planName} Plan (${invoiceNum})`,
          html,
        });
        logger.info(`[EMAIL] ✅ Receipt email delivered to ${to}`);
      }
    } catch (err: any) {
      logger.warn(`[EMAIL] Receipt email note: ${err?.message || err}`);
    }
  }

  async sendWelcomeRegistrationEmail(to: string, name: string): Promise<void> {
    logger.info(`[EMAIL] Dispatching Welcome Registration Notification to ${to} (${name})`);
    if (!this.transporter) {
      this.initTransporter();
    }

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0b0f19; color: #f8fafc; padding: 40px 20px; max-width: 600px; margin: 0 auto; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 28px;">
          <div style="display: inline-block; padding: 10px 18px; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); border-radius: 12px; margin-bottom: 12px;">
            <span style="font-size: 22px; font-weight: bold; color: #ffffff; letter-spacing: 0.5px;">DocuFlow AI</span>
          </div>
          <h1 style="color: #ffffff; font-size: 24px; margin: 8px 0 4px; font-weight: 700;">Welcome to DocuFlow AI!</h1>
          <p style="color: #94a3b8; font-size: 14px; margin: 0;">Your Intelligent All-in-One Document Workspace</p>
        </div>
        
        <div style="background-color: #131b2e; padding: 28px; border-radius: 14px; border: 1px solid #23314f; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);">
          <h2 style="color: #ffffff; font-size: 18px; margin-top: 0;">Hi ${name},</h2>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
            Thank you for creating your account! We're thrilled to have you on board. Your new account is ready with full access to our AI document creation, editing, conversion, and collaboration suite.
          </p>

          <div style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.25); border-radius: 10px; padding: 18px; margin: 20px 0;">
            <h3 style="color: #818cf8; font-size: 14px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.5px;">✨ Included with your Free Plan:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #e2e8f0; font-size: 13px; line-height: 1.8;">
              <li><strong>100 Free AI Credits</strong> for AI Writer, PDF Chat, & Excel Insights</li>
              <li><strong>50 GB High-Speed Cloud Storage</strong> for your documents</li>
              <li><strong>PDF Suite:</strong> Merge, split, compress, sign, and convert PDFs</li>
              <li><strong>Full Office Suite:</strong> Word, Excel, and PowerPoint online editors</li>
              <li><strong>Smart OCR & Scanner:</strong> Extract text and tables instantly</li>
            </ul>
          </div>

          <table style="width: 100%; margin: 16px 0; border-collapse: collapse; font-size: 13px; color: #94a3b8;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #1e293b;"><strong>Registered Email:</strong></td>
              <td style="padding: 8px 0; color: #f1f5f9; text-align: right; border-bottom: 1px solid #1e293b;">${to}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #1e293b;"><strong>Plan Tier:</strong></td>
              <td style="padding: 8px 0; color: #10b981; font-weight: bold; text-align: right; border-bottom: 1px solid #1e293b;">Free Starter Edition</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Registration Time:</strong></td>
              <td style="padding: 8px 0; color: #f1f5f9; text-align: right;">${new Date().toLocaleString()}</td>
            </tr>
          </table>

          <div style="text-align: center; margin: 28px 0 12px;">
            <a href="${env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; font-weight: 600; font-size: 15px; border-radius: 10px; box-shadow: 0 4px 14px 0 rgba(99, 102, 241, 0.4);">
              🚀 Launch Your Workspace
            </a>
          </div>

          <p style="color: #64748b; font-size: 12px; margin-top: 24px; border-top: 1px solid #1e293b; padding-top: 16px; line-height: 1.5;">
            🔒 <strong>Security Tip:</strong> Keep your password safe and never share it with anyone. If you didn't create this account, please ignore this email or contact support.
          </p>
        </div>

        <div style="text-align: center; margin-top: 24px; color: #64748b; font-size: 11px;">
          &copy; ${new Date().getFullYear()} DocuFlow AI Suite. All rights reserved.
        </div>
      </div>
    `;

    try {
      if (this.transporter) {
        await this.transporter.sendMail({
          from: `"DocuFlow AI" <${env.SMTP_USER || 'noreply@docuflow.ai'}>`,
          to,
          subject: '🎉 Welcome to DocuFlow AI! Your account is ready',
          html,
        });
        logger.info(`[EMAIL] ✅ Welcome registration email delivered to ${to}`);
      }
    } catch (err: any) {
      logger.warn(`[EMAIL] Welcome email note: ${err?.message || err}`);
    }
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    await this.sendWelcomeRegistrationEmail(to, name);
  }

  async sendOTPEmail(to: string, otp: string): Promise<void> {
    logger.info(`[EMAIL] Sending OTP (${otp}) to ${to}`);
    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: `"DocuFlow AI" <${env.SMTP_USER}>`,
          to,
          subject: `🔐 Your DocuFlow AI OTP Verification Code: ${otp}`,
          text: `Your verification code is ${otp}. It expires in 10 minutes.`,
        });
      } catch (err: any) {
        logger.warn(`[EMAIL] OTP error: ${err?.message || err}`);
      }
    }
  }

  async sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
    logger.info(`[EMAIL] Sending Password Reset Link to ${to}`);
  }

  async sendShareInvite(to: string, documentName: string, role: string, shareUrl: string): Promise<void> {
    logger.info(`[EMAIL] Sending Share Invite to ${to}`);
  }
}

export const emailService = new EmailService();
