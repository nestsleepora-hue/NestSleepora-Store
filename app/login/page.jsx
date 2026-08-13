'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import { Mail, Lock, ArrowRight, Eye, EyeOff, ShieldCheck, RefreshCw, X, KeySquare } from 'lucide-react';
import ScrollReveal from '../../components/ScrollReveal';

export default function Login() {
  const { login, loginWithGoogle, sanitizeInput, generateOtp, verifyOtp, updateUserPassword, mapAuthError, completeAdminLogin, API_URL, verifyAdminOtp, setDeviceTrustCookie, checkDeviceTrustCookie, adminLogin } = useCart();
  const router = useRouter();

  // Screen layout states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP Login states
  const [step, setStep] = useState('credentials'); // 'credentials' | 'otp'
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [dispatchedOtp, setDispatchedOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef([]);

  // Brute Force defense states
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState(null);
  const [lockCountdown, setLockCountdown] = useState(0);
  const [pendingAdminSession, setPendingAdminSession] = useState(null);

  // Forgot password states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState('email'); // 'email' | 'otp' | 'reset'
  const [forgotOtpDigits, setForgotOtpDigits] = useState(['', '', '', '', '', '']);
  const [forgotDispatchedOtp, setForgotDispatchedOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const forgotOtpRefs = useRef([]);

  // SSR Safe initialization of local storage settings
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedAttempts = parseInt(localStorage.getItem('sleepora_failed_attempts') || '0');
      const storedUntil = localStorage.getItem('sleepora_lock_until');
      setFailedAttempts(storedAttempts);
      if (storedUntil) setLockUntil(parseInt(storedUntil));
    }
  }, []);

  // Resend OTP countdown timer
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Lockout countdown timer
  useEffect(() => {
    let interval;
    if (lockUntil) {
      const remaining = Math.max(0, Math.round((lockUntil - Date.now()) / 1000));
      setLockCountdown(remaining);

      if (remaining > 0) {
        interval = setInterval(() => {
          const rem = Math.max(0, Math.round((lockUntil - Date.now()) / 1000));
          setLockCountdown(rem);
          if (rem <= 0) {
            setLockUntil(null);
            setFailedAttempts(0);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('sleepora_lock_until');
              localStorage.setItem('sleepora_failed_attempts', '0');
            }
          }
        }, 1000);
      } else {
        setLockUntil(null);
        setFailedAttempts(0);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('sleepora_lock_until');
          localStorage.setItem('sleepora_failed_attempts', '0');
        }
      }
    }
    return () => clearInterval(interval);
  }, [lockUntil]);

  // Handle brute force attempt logging
  const recordFailedAttempt = () => {
    const nextCount = failedAttempts + 1;
    setFailedAttempts(nextCount);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sleepora_failed_attempts', nextCount.toString());
    }

    if (nextCount >= 5) {
      const lockTime = Date.now() + 15 * 60 * 1000; // 15 minute lock
      setLockUntil(lockTime);
      if (typeof window !== 'undefined') {
        localStorage.setItem('sleepora_lock_until', lockTime.toString());
      }
      setError('Too many failed attempts. Login is temporarily locked for 15 minutes.');
    }
  };

  // Form input validation & credential submit
  const handleCredentialSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (lockUntil && Date.now() < lockUntil) {
      setError(`Login locked. Please try again in ${lockCountdown} seconds.`);
      return;
    }

    const cleanEmail = sanitizeInput(email);
    const cleanPassword = sanitizeInput(password);

    if (!cleanEmail || !cleanPassword) {
      setError('Please enter valid, sanitized credentials.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please provide a valid email format.');
      return;
    }

    setLoading(true);
    try {
      let isUserAdmin = false;
      let adminData = null;
      try {
        adminData = await adminLogin(cleanEmail, cleanPassword);
        isUserAdmin = true;
      } catch (err) {
        // Shopper fallback
      }

      if (isUserAdmin && adminData) {
        if (adminData.status === 'otp_required') {
          setPendingAdminSession(adminData);
          setStep('otp');
          setResendTimer(60);
          return;
        }
        
        completeAdminLogin(adminData);
        setFailedAttempts(0);
        if (typeof window !== 'undefined') {
          localStorage.setItem('sleepora_failed_attempts', '0');
        }
        router.push('/admin');
        return;
      }

      const isTrusted = checkDeviceTrustCookie(cleanEmail);
      if (isTrusted) {
        await login(cleanEmail, cleanPassword);
        setFailedAttempts(0);
        if (typeof window !== 'undefined') {
          localStorage.setItem('sleepora_failed_attempts', '0');
        }
        router.push('/profile');
        return;
      }

      const users = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('sleepora_mock_users') || '[]') : [];
      const userExists = users.find(u => u.email === cleanEmail && u.password === cleanPassword);
      
      if (!userExists && cleanEmail !== 'test@sleepora.com') {
        throw new Error('Auth/User not found or password incorrect');
      }
      
      const otp = await generateOtp(cleanEmail);
      setDispatchedOtp(otp);
      setStep('otp');
      setResendTimer(60);
    } catch (err) {
      recordFailedAttempt();
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // OTP Login verify code
  const handleOtpVerify = async (e) => {
    e.preventDefault();
    setError('');

    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length < 6) {
      setError('Please input the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      if (pendingAdminSession) {
        await verifyAdminOtp(sanitizeInput(email), enteredOtp);
        setDeviceTrustCookie(sanitizeInput(email));
        setFailedAttempts(0);
        if (typeof window !== 'undefined') {
          localStorage.setItem('sleepora_failed_attempts', '0');
        }
        router.push('/admin');
        return;
      }

      const isOtpValid = await verifyOtp(sanitizeInput(email), enteredOtp);
      if (!isOtpValid) {
        throw new Error('Security Error: Invalid or expired OTP code.');
      }

      await login(sanitizeInput(email), sanitizeInput(password));
      setDeviceTrustCookie(sanitizeInput(email));
      setFailedAttempts(0);
      if (typeof window !== 'undefined') {
        localStorage.setItem('sleepora_failed_attempts', '0');
      }
      router.push('/profile');
    } catch (err) {
      recordFailedAttempt();
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      router.push('/profile');
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    const cleanEmail = sanitizeInput(email);
    try {
      const otp = await generateOtp(cleanEmail);
      setDispatchedOtp(otp);
      setResendTimer(60);
      setError('');
    } catch (err) {
      setError(mapAuthError(err));
    }
  };

  const handleOtpChange = (index, value, digits, setDigits, refs) => {
    const cleanVal = value.replace(/[^0-9]/g, '');
    const newDigits = [...digits];
    newDigits[index] = cleanVal.substring(cleanVal.length - 1);
    setDigits(newDigits);

    if (cleanVal && index < 5 && refs.current[index + 1]) {
      refs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e, digits, setDigits, refs) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0 && refs.current[index - 1]) {
      refs.current[index - 1].focus();
    }
  };

  const handleForgotEmailSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');

    const cleanEmail = sanitizeInput(forgotEmail);
    if (!cleanEmail) {
      setForgotError('Please enter a valid email.');
      return;
    }

    const users = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('sleepora_mock_users') || '[]') : [];
    const userExists = users.some(u => u.email === cleanEmail);

    if (!userExists && cleanEmail !== 'test@sleepora.com') {
      setForgotError('No registered account found with this email.');
      return;
    }

    try {
      const otp = await generateOtp(cleanEmail);
      setForgotDispatchedOtp(otp);
      setForgotStep('otp');
    } catch (err) {
      setForgotError(mapAuthError(err));
    }
  };

  const handleForgotOtpSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');

    const enteredOtp = forgotOtpDigits.join('');
    if (enteredOtp.length < 6) {
      setForgotError('Please enter the 6-digit code.');
      return;
    }

    try {
      const isValid = await verifyOtp(sanitizeInput(forgotEmail), enteredOtp);
      if (!isValid) {
        setForgotError('Security Error: Invalid or expired reset OTP code.');
        return;
      }
      setForgotStep('reset');
    } catch (err) {
      setForgotError(mapAuthError(err));
    }
  };

  const handleForgotResetSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');

    const cleanPass = sanitizeInput(forgotNewPassword);
    const cleanConf = sanitizeInput(forgotConfirmPassword);

    if (cleanPass.length < 6) {
      setForgotError('Password must be at least 6 characters.');
      return;
    }

    if (cleanPass !== cleanConf) {
      setForgotError('Passwords do not match.');
      return;
    }

    try {
      await updateUserPassword(sanitizeInput(forgotEmail), cleanPass);
      alert('Password updated successfully! You can now log in.');
      setShowForgotModal(false);
      resetForgotState();
    } catch (err) {
      setForgotError(mapAuthError(err));
    }
  };

  const resetForgotState = () => {
    setForgotEmail('');
    setForgotStep('email');
    setForgotOtpDigits(['', '', '', '', '', '']);
    setForgotDispatchedOtp('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotError('');
  };

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden grid grid-cols-1 lg:grid-cols-12 bg-dreamBackground relative">
      
      {/* Left side: Premium brand visual pane */}
      <div className="hidden lg:flex lg:col-span-5 relative bg-dreamNavy text-white overflow-hidden flex-col justify-between p-8 lg:p-10 h-full text-left">
        <div className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-45" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&q=80&w=800')" }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-dreamNavy via-dreamNavy/80 to-transparent"></div>
        
        <div className="relative z-10">
          <Link href="/" className="text-2xl font-extrabold tracking-tight font-poppins text-white">
            NestSleep<span className="text-dreamAccent">ora</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-3">
          <h2 className="text-2xl lg:text-3xl font-extrabold font-poppins leading-tight text-white">
            Enter the NestSleepora Sanctuary.
          </h2>
          <p className="text-xs lg:text-sm text-[#F1EEE8]/85 leading-relaxed max-w-sm font-sans">
            Premium timber frames and orthopedic support systems designed to restore alignment and deliver deep, quiet sleep.
          </p>
        </div>

        <div className="relative z-10 text-[10px] text-dreamMuted">
          &copy; {new Date().getFullYear()} NestSleepora Sleep Products Inc.
        </div>
      </div>

      {/* Right side: Form pane */}
      <div className="lg:col-span-7 flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden min-h-screen lg:h-full font-sans">
        <div className="absolute top-1/4 -right-24 w-80 h-80 bg-dreamAccent/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 -left-24 w-80 h-80 bg-dreamBlush/40 rounded-full blur-3xl pointer-events-none"></div>

        <ScrollReveal>
          <div className="w-full max-w-md bg-white/70 backdrop-blur-md border border-dreamBorder rounded-premiumLarge p-5 sm:p-6 md:p-8 shadow-lg relative z-10 max-h-[96vh] overflow-y-auto scrollbar-none">
            
            {step === 'credentials' && (
              <>
                <div className="space-y-1 mb-4 text-left">
                  <h2 className="text-xl sm:text-2xl font-extrabold font-poppins text-dreamNavy">Sign In</h2>
                  <p className="text-[11px] sm:text-xs text-dreamMuted">Access your customized alignment profiles and saved sanctuary orders.</p>
                </div>

                {/* Google Sign In Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading || (lockUntil && Date.now() < lockUntil)}
                  className="w-full h-10 border border-dreamBorder bg-white hover:bg-[#F1EEE8]/40 rounded-premium text-xs font-bold text-dreamNavy flex items-center justify-center gap-3 transition-colors mb-4 shadow-sm disabled:opacity-50"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </button>

                {/* Email Divider */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-[1px] bg-dreamBorder flex-1"></div>
                  <span className="text-[9px] font-extrabold uppercase text-dreamMuted tracking-wider">or sign in with email</span>
                  <div className="h-[1px] bg-dreamBorder flex-1"></div>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-dreamRed/10 border border-dreamRed/20 text-dreamRed text-xs font-bold rounded-premium leading-relaxed text-left">
                    {error}
                  </div>
                )}

                <form onSubmit={handleCredentialSubmit} className="space-y-3.5 text-left">
                  {/* Email Address */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-dreamNavy tracking-wider">Email Address</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dreamMuted">
                        <Mail className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="email"
                        required
                        disabled={lockUntil && Date.now() < lockUntil}
                        placeholder="name@domain.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-10 pl-9 pr-4 bg-white border border-dreamBorder rounded-premium text-xs text-dreamNavy placeholder-dreamMuted/70 focus:outline-none focus:border-dreamAccent focus:ring-1 focus:ring-dreamAccent transition-all shadow-sm disabled:opacity-55"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-extrabold uppercase text-dreamNavy tracking-wider">Password</label>
                      <button
                        type="button"
                        onClick={() => {
                          resetForgotState();
                          setShowForgotModal(true);
                        }}
                        className="text-[10px] text-dreamAccent hover:underline font-bold"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dreamMuted">
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        disabled={lockUntil && Date.now() < lockUntil}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-10 pl-9 pr-9 bg-white border border-dreamBorder rounded-premium text-xs text-dreamNavy placeholder-dreamMuted/70 focus:outline-none focus:border-dreamAccent focus:ring-1 focus:ring-dreamAccent transition-all shadow-sm disabled:opacity-55"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-dreamMuted hover:text-dreamNavy transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {lockUntil && Date.now() < lockUntil && (
                    <div className="p-2 bg-dreamRed/5 text-dreamRed text-[10px] font-bold rounded text-center">
                      ⚠️ Brute force lock active. Retry in {lockCountdown} seconds.
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || (lockUntil && Date.now() < lockUntil)}
                    className="w-full h-10 bg-dreamAccent hover:bg-dreamAccent-dark disabled:bg-dreamAccent/50 text-xs font-bold text-white rounded-premium flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                  >
                    {loading ? 'Verifying Credentials...' : 'Sign In'}
                    {!loading && <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                </form>

                <div className="mt-4 pt-4 border-t border-dreamBorder text-center">
                  <p className="text-[11px] text-dreamMuted">
                    New to NestSleepora?{' '}
                    <Link href="/signup" className="text-dreamAccent hover:underline font-bold">
                      Create an account
                    </Link>
                  </p>
                </div>
              </>
            )}

            {step === 'otp' && (
              <div className="space-y-6 text-left">
                <div className="space-y-1.5">
                  <h2 className="text-xl sm:text-2xl font-extrabold font-poppins text-dreamNavy">Security Check</h2>
                  <p className="text-[11px] sm:text-xs text-dreamMuted leading-relaxed">
                    A secure 6-digit OTP code was dispatched to <strong className="text-dreamNavy">{email === 'mateen@itdepartment.com' ? 'mateen.soram@gmail.com' : email}</strong>. Please enter the verification code below.
                  </p>
                </div>

                {dispatchedOtp && !pendingAdminSession && (
                  <div className="p-3 bg-dreamAccent/10 border border-dreamAccent/20 rounded-premium flex items-center gap-3 text-xs text-dreamAccent-dark font-semibold">
                    <ShieldCheck className="w-5 h-5 shrink-0" />
                    <span>[Security Dispatcher] Test Code is: <strong>{dispatchedOtp}</strong></span>
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-dreamRed/10 border border-dreamRed/20 text-dreamRed text-xs font-bold rounded-premium leading-relaxed">
                    ⚠️ {error}
                  </div>
                )}

                <form onSubmit={handleOtpVerify} className="space-y-6">
                  <div className="flex gap-2.5 justify-center">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpRefs.current[idx] = el)}
                        type="text"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value, otpDigits, setOtpDigits, otpRefs)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e, otpDigits, setOtpDigits, otpRefs)}
                        className="w-11 h-12 border border-dreamBorder bg-white rounded-premium text-center font-bold text-lg text-dreamNavy focus:outline-none focus:border-dreamAccent focus:ring-1 focus:ring-dreamAccent transition-all shadow-sm"
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-dreamNavy hover:bg-dreamNavy/90 text-white text-xs font-bold rounded-premium flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                  >
                    {loading ? 'Authorizing Session...' : 'Verify & Sign In'}
                    {!loading && <ShieldCheck className="w-4 h-4" />}
                  </button>
                </form>

                <div className="flex justify-between items-center text-xs mt-4 pt-4 border-t border-dreamBorder">
                  <button
                    onClick={() => {
                      setStep('credentials');
                      setError('');
                    }}
                    className="text-dreamMuted hover:text-dreamNavy font-semibold"
                  >
                    &larr; Back to credentials
                  </button>
                  
                  <button
                    onClick={handleResendOtp}
                    disabled={resendTimer > 0}
                    className="text-dreamAccent disabled:text-dreamMuted font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${resendTimer > 0 ? 'opacity-50' : 'animate-spin-slow'}`} />
                    {resendTimer > 0 ? `Resend OTP (${resendTimer}s)` : 'Resend Code'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </ScrollReveal>
      </div>

      {/* Security reset modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dreamNavy/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-dreamBorder rounded-premiumLarge shadow-2xl overflow-hidden animate-fade-in relative">
            
            <div className="bg-dreamNavy text-white p-5 flex justify-between items-center text-left">
              <div className="space-y-0.5">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-dreamAccent">Postural Recovery Support</span>
                <h3 className="text-base font-bold font-poppins flex items-center gap-2">
                  <KeySquare className="w-4 h-4 text-dreamAccent" />
                  Reset NestSleepora Password
                </h3>
              </div>
              <button 
                onClick={() => { setShowForgotModal(false); resetForgotState(); }}
                className="text-dreamMuted hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-left font-sans">
              {forgotError && (
                <div className="p-3 bg-dreamRed/10 border border-dreamRed/20 text-dreamRed text-xs font-semibold rounded-premium leading-relaxed">
                  ⚠️ {forgotError}
                </div>
              )}

              {forgotStep === 'email' && (
                <form onSubmit={handleForgotEmailSubmit} className="space-y-4">
                  <p className="text-xs text-dreamMuted leading-relaxed">
                    Input your registered account email. A secure 6-digit verification code will be dispatched to confirm your identity.
                  </p>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-dreamNavy tracking-wider">Account Email</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-dreamMuted">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        type="email"
                        required
                        placeholder="name@domain.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full h-11 pl-10 pr-4 bg-white border border-dreamBorder rounded-premium text-sm text-dreamNavy placeholder-dreamMuted/70 focus:outline-none focus:border-dreamAccent transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full h-11 bg-dreamAccent hover:bg-dreamAccent-dark text-white text-xs font-bold rounded-premium flex items-center justify-center gap-2 shadow-md transition-colors"
                  >
                    Dispatch Reset OTP
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {forgotStep === 'otp' && (
                <form onSubmit={handleForgotOtpSubmit} className="space-y-5">
                  <p className="text-xs text-dreamMuted leading-relaxed">
                    Enter the 6-digit reset code sent to <strong className="text-dreamNavy">{forgotEmail}</strong>.
                  </p>

                  {forgotDispatchedOtp && (
                    <div className="p-3 bg-dreamAccent/10 border border-dreamAccent/20 rounded-premium flex items-center gap-3 text-xs text-dreamAccent-dark font-semibold">
                      <ShieldCheck className="w-5 h-5 shrink-0" />
                      <span>[Security Dispatcher] Reset Code is: <strong>{forgotDispatchedOtp}</strong></span>
                    </div>
                  )}

                  <div className="flex gap-2.5 justify-center">
                    {forgotOtpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (forgotOtpRefs.current[idx] = el)}
                        type="text"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value, forgotOtpDigits, setForgotOtpDigits, forgotOtpRefs)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e, forgotOtpDigits, setForgotOtpDigits, forgotOtpRefs)}
                        className="w-11 h-12 border border-dreamBorder bg-white rounded-premium text-center font-bold text-lg text-dreamNavy focus:outline-none focus:border-dreamAccent focus:ring-1 focus:ring-dreamAccent transition-all shadow-sm"
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    className="w-full h-11 bg-dreamNavy hover:bg-dreamNavy/90 text-white text-xs font-bold rounded-premium flex items-center justify-center gap-2 shadow-md transition-colors"
                  >
                    Verify Reset Code
                    <ShieldCheck className="w-4 h-4" />
                  </button>
                </form>
              )}

              {forgotStep === 'reset' && (
                <form onSubmit={handleForgotResetSubmit} className="space-y-4">
                  <p className="text-xs text-dreamMuted leading-relaxed">
                    Identity verified. Please set a strong, unique new password for your NestSleepora account.
                  </p>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-dreamNavy tracking-wider">New Password</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-dreamMuted">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        className="w-full h-11 pl-10 pr-4 bg-white border border-dreamBorder rounded-premium text-sm text-dreamNavy placeholder-dreamMuted/70 focus:outline-none focus:border-dreamAccent transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-dreamNavy tracking-wider">Confirm New Password</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-dreamMuted">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        className="w-full h-11 pl-10 pr-4 bg-white border border-dreamBorder rounded-premium text-sm text-dreamNavy placeholder-dreamMuted/70 focus:outline-none focus:border-dreamAccent transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full h-11 bg-dreamAccent hover:bg-dreamAccent-dark text-white text-xs font-bold rounded-premium flex items-center justify-center gap-2 shadow-md transition-colors"
                  >
                    Update Account Password
                    <ShieldCheck className="w-4 h-4" />
                  </button>
                </form>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
