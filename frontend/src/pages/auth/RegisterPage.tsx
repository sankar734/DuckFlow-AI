import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Mail, User as UserIcon, Lock, Eye, EyeOff, CheckCircle2, XCircle, AlertTriangle, Loader2, ArrowRight, KeyRound, RotateCw, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { authService } from '../../services/authService';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { toast } from 'sonner';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { addNotification } = useNotificationStore();

  // Registration Form Step: 'details' | 'otp'
  const [step, setStep] = useState<'details' | 'otp'>('details');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // OTP state
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Real-time Email Verification state
  const [emailCheckStatus, setEmailCheckStatus] = useState<{
    state: 'idle' | 'checking' | 'valid' | 'disposable' | 'invalid_domain' | 'in_use' | 'invalid_format';
    message: string;
  }>({ state: 'idle', message: '' });

  const debounceTimerRef = useRef<any>(null);

  // Debounced real-time email check
  useEffect(() => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setEmailCheckStatus({ state: 'idle', message: '' });
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setEmailCheckStatus({ state: 'checking', message: 'Verifying email & mail server...' });

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await authService.checkEmail(trimmed, 'register');
        const data = res.data;

        if (data.isDisposable) {
          setEmailCheckStatus({
            state: 'disposable',
            message: 'Temporary / disposable emails are not allowed.',
          });
        } else if (data.inUse) {
          setEmailCheckStatus({
            state: 'in_use',
            message: 'This email is already registered.',
          });
        } else if (!data.valid) {
          setEmailCheckStatus({
            state: 'invalid_domain',
            message: data.message || 'Invalid email address or domain.',
          });
        } else {
          setEmailCheckStatus({
            state: 'valid',
            message: 'Active email domain verified.',
          });
        }
      } catch (err: any) {
        setEmailCheckStatus({
          state: 'invalid_format',
          message: err.message || 'Please enter a valid email format.',
        });
      }
    }, 600);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [email]);

  // Resend Countdown Timer
  useEffect(() => {
    let interval: any;
    if (step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!password) return { label: '', score: 0, color: 'bg-slate-700' };
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 2) return { label: 'Weak', score: 1, color: 'bg-rose-500', text: 'text-rose-500' };
    if (score <= 4) return { label: 'Medium', score: 2, color: 'bg-amber-500', text: 'text-amber-500' };
    return { label: 'Strong', score: 3, color: 'bg-emerald-500', text: 'text-emerald-500' };
  };

  const strength = getPasswordStrength();

  // Step 1: Send OTP to user's real email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    if (emailCheckStatus.state === 'disposable') {
      toast.error('Temporary / disposable emails are not allowed. Please use your genuine email.');
      return;
    }
    if (emailCheckStatus.state === 'in_use') {
      toast.error('This email is already registered. Please sign in instead.');
      return;
    }
    if (emailCheckStatus.state === 'invalid_domain' || emailCheckStatus.state === 'invalid_format') {
      toast.error(emailCheckStatus.message || 'Please enter a valid active email address.');
      return;
    }
    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!agreeTerms) {
      toast.error('Please accept terms & conditions');
      return;
    }

    setIsLoading(true);
    try {
      await authService.sendRegisterOTP({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
      });

      toast.success(`Verification code sent to ${email}`);
      setStep('otp');
      setResendTimer(60);
      setCanResend(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send verification code. Please check your email.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP and finalize registration
  const handleVerifyOtpAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.trim().length < 6) {
      toast.error('Please enter the complete 6-digit verification code');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const res = await authService.verifyRegisterOTP({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        otp: otp.trim(),
      });

      login(res.data.user, res.data.accessToken, res.data.refreshToken);

      addNotification({
        title: '🎉 Email Verified & Account Created!',
        message: `Your email (${email}) has been verified. Welcome to DocuFlow AI with 100 free AI credits and local document workspace.`,
        type: 'security',
        emailDispatched: true,
      });

      toast.success(`Email verified! Welcome, ${res.data.user.name}!`);
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Invalid or expired verification code. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend) return;
    setIsLoading(true);
    try {
      await authService.sendRegisterOTP({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
      });
      toast.success(`New verification code sent to ${email}`);
      setResendTimer(60);
      setCanResend(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 transition-colors">
      <div className="w-full max-w-md p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden my-8">
        {/* Decorative ambient glows */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {step === 'details' ? (
          /* STEP 1: REGISTRATION FORM */
          <>
            <div className="flex flex-col items-center text-center mb-6 relative z-10">
              <Link to="/" className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-purple-600 flex items-center justify-center text-white shadow-glow mb-3 transform hover:scale-105 transition-transform">
                <Sparkles className="w-6 h-6" />
              </Link>
              <h2 className="text-2xl font-bold tracking-tight">Create Free Account</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Get instant access with 100 free AI credits and local document workspace</p>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-3.5 relative z-10">
              <Input
                label="Full Name"
                type="text"
                placeholder="Alex Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<UserIcon className="w-4 h-4 text-slate-400" />}
                required
                autoFocus
              />

              <div>
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="alex@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                  rightIcon={
                    emailCheckStatus.state === 'checking' ? (
                      <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />
                    ) : emailCheckStatus.state === 'valid' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : emailCheckStatus.state === 'disposable' || emailCheckStatus.state === 'invalid_domain' ? (
                      <XCircle className="w-4 h-4 text-rose-500" />
                    ) : emailCheckStatus.state === 'in_use' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    ) : undefined
                  }
                  required
                />
                {emailCheckStatus.state !== 'idle' && (
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] px-1">
                    {emailCheckStatus.state === 'checking' && (
                      <span className="text-slate-400 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> {emailCheckStatus.message}
                      </span>
                    )}
                    {emailCheckStatus.state === 'valid' && (
                      <span className="text-emerald-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {emailCheckStatus.message}
                      </span>
                    )}
                    {(emailCheckStatus.state === 'disposable' || emailCheckStatus.state === 'invalid_domain' || emailCheckStatus.state === 'invalid_format') && (
                      <span className="text-rose-500 flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> {emailCheckStatus.message}
                      </span>
                    )}
                    {emailCheckStatus.state === 'in_use' && (
                      <span className="text-amber-500 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {emailCheckStatus.message}{' '}
                        <Link to="/login" className="underline font-bold ml-1">Sign in</Link>
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-200 focus:outline-none transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  required
                />
                {password && (
                  <div className="mt-1.5 flex items-center justify-between gap-2 px-1">
                    <div className="flex-1 flex gap-1 h-1.5">
                      <div className={`h-full rounded-full transition-all flex-1 ${strength.score >= 1 ? strength.color : 'bg-slate-200 dark:bg-slate-800'}`} />
                      <div className={`h-full rounded-full transition-all flex-1 ${strength.score >= 2 ? strength.color : 'bg-slate-200 dark:bg-slate-800'}`} />
                      <div className={`h-full rounded-full transition-all flex-1 ${strength.score >= 3 ? strength.color : 'bg-slate-200 dark:bg-slate-800'}`} />
                    </div>
                    <span className={`text-[10px] font-semibold ${strength.text}`}>
                      {strength.label}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <Input
                  label="Confirm Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                  required
                />
                {confirmPassword && (
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] px-1">
                    {password === confirmPassword ? (
                      <span className="text-emerald-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
                      </span>
                    ) : (
                      <span className="text-rose-500">Passwords do not match</span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 pt-1">
                <input
                  type="checkbox"
                  id="termsCheckbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500 bg-white dark:bg-slate-800"
                />
                <label htmlFor="termsCheckbox" className="cursor-pointer select-none">
                  I agree to the <span className="text-brand-500 hover:underline">Terms of Service</span> & <span className="text-brand-500 hover:underline">Privacy Policy</span>
                </label>
              </div>

              <Button
                type="submit"
                variant="gradient"
                size="md"
                isLoading={isLoading}
                disabled={emailCheckStatus.state === 'disposable' || emailCheckStatus.state === 'in_use'}
                className="w-full font-bold shadow-glow py-2.5 mt-2"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Send Verification Code &rarr;
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="text-brand-500 hover:text-brand-400 font-bold hover:underline ml-1">
                  Sign In &rarr;
                </Link>
              </p>
            </div>
          </>
        ) : (
          /* STEP 2: REAL-TIME OTP EMAIL VERIFICATION SCREEN */
          <>
            <div className="flex flex-col items-center text-center mb-6 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-glow mb-3 animate-pulse">
                <KeyRound className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Verify Your Email</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                We've sent a 6-digit verification code to:
              </p>
              <div className="mt-1 px-3 py-1 bg-brand-500/10 border border-brand-500/30 rounded-lg text-brand-400 font-semibold text-xs inline-block">
                {email}
              </div>
            </div>

            <form onSubmit={handleVerifyOtpAndRegister} className="space-y-4 relative z-10">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 text-center">
                  Enter 6-Digit OTP Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center text-2xl font-mono tracking-[8px] font-bold py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all shadow-inner"
                    autoFocus
                    required
                  />
                </div>
                <p className="text-[11px] text-center text-slate-400 mt-2">
                  Check your inbox & spam folder for the verification code
                </p>
              </div>

              <Button
                type="submit"
                variant="gradient"
                size="md"
                isLoading={isVerifyingOtp}
                className="w-full font-bold shadow-glow py-3"
                rightIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Verify & Complete Registration
              </Button>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  className="flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Edit Details
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={!canResend || isLoading}
                  className={`flex items-center gap-1 font-semibold transition-colors ${canResend ? 'text-brand-400 hover:text-brand-300 cursor-pointer' : 'text-slate-500 cursor-not-allowed'}`}
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  {canResend ? 'Resend Code' : `Resend in ${resendTimer}s`}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
