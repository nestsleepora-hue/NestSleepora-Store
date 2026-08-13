import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { User, Mail, Lock, ArrowRight, Eye, EyeOff, ShieldCheck, KeySquare } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';

export default function Signup() {
  const { register, loginWithGoogle, sanitizeInput, mapAuthError, generateOtp, verifyOtp, setDeviceTrustCookie } = useCart();
  const navigate = useNavigate();
  
  // Form input fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP Sign Up states
  const [step, setStep] = useState('credentials'); // 'credentials' | 'otp'
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [dispatchedOtp, setDispatchedOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef([]);

  // Resend countdown timer
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleOtpChange = (index, value) => {
    const cleanVal = value.replace(/[^0-9]/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = cleanVal.substring(cleanVal.length - 1);
    setOtpDigits(newDigits);

    if (cleanVal && index < 5 && otpRefs.current[index + 1]) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0 && otpRefs.current[index - 1]) {
      otpRefs.current[index - 1].focus();
    }
  };

  const handleResendOtp = async () => {
    setError('');
    const cleanEmail = sanitizeInput(email);
    try {
      const code = await generateOtp(cleanEmail);
      setDispatchedOtp(code);
      setResendTimer(60);
    } catch (err) {
      setError(mapAuthError(err));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanName = sanitizeInput(name);
    const cleanEmail = sanitizeInput(email);
    const cleanPassword = sanitizeInput(password);

    if (!cleanName || !cleanEmail || !cleanPassword) {
      setError('Please input valid, sanitized registration details.');
      return;
    }

    if (cleanName.length < 2) {
      setError('Full Name must be at least 2 characters.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (cleanPassword.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      // Dispatch Verification OTP
      const code = await generateOtp(cleanEmail);
      setDispatchedOtp(code);
      setStep('otp');
      setResendTimer(60);
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

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
      const cleanEmail = sanitizeInput(email);
      const isOtpValid = await verifyOtp(cleanEmail, enteredOtp);
      if (!isOtpValid) {
        throw new Error('Security Error: Invalid or expired verification code.');
      }

      // Valid -> Complete Firebase Register
      await register(cleanEmail, sanitizeInput(password), sanitizeInput(name));
      
      // Save device trust cookie for 30 days
      setDeviceTrustCookie(cleanEmail);

      navigate('/profile');
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const userObj = await loginWithGoogle();
      // Google Auth inherently verifies device/identity
      if (userObj && userObj.email) {
        setDeviceTrustCookie(userObj.email);
      }
      navigate('/profile');
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden grid grid-cols-1 lg:grid-cols-12 bg-dreamBackground relative">
      
      {/* Left side: Premium brand visual pane */}
      <div className="hidden lg:flex lg:col-span-5 relative bg-dreamNavy text-white overflow-hidden flex-col justify-between p-8 lg:p-10 h-full">
        <div className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-40" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&q=80&w=800')" }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-dreamNavy via-dreamNavy/80 to-transparent"></div>
        
        {/* Brand identity */}
        <div className="relative z-10">
          <Link to="/" className="text-2xl font-extrabold tracking-tight font-poppins text-white">
            NestSleep<span className="text-dreamAccent">ora</span>
          </Link>
        </div>

        {/* Brand statement */}
        <div className="relative z-10 space-y-3">
          <h2 className="text-2xl lg:text-3xl font-extrabold font-poppins leading-tight text-white">
            Crafted for Deeper Recovery.
          </h2>
          <p className="text-xs lg:text-sm text-[#F1EEE8]/85 leading-relaxed max-w-sm">
            Unlock persistent orthotopic settings, live order history trackers, and a fully synced personal wishlist cloud locker.
          </p>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-[10px] text-dreamMuted">
          &copy; {new Date().getFullYear()} NestSleepora Sleep Products Inc.
        </div>
      </div>

      {/* Right side: Form pane */}
      <div className="lg:col-span-7 flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden min-h-screen lg:h-full">
        {/* Decorative background gradients */}
        <div className="absolute top-1/4 -right-24 w-80 h-80 bg-dreamAccent/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 -left-24 w-80 h-80 bg-dreamBlush/40 rounded-full blur-3xl pointer-events-none"></div>

        <ScrollReveal>
          <div className="w-full max-w-md bg-white/70 backdrop-blur-md border border-dreamBorder rounded-premiumLarge p-5 sm:p-6 md:p-8 shadow-lg relative z-10 max-h-[96vh] overflow-y-auto scrollbar-none">
            
            {/* 1. Step: Registration Credentials Form */}
            {step === 'credentials' && (
              <>
                <div className="space-y-1 mb-4 text-left">
                  <h2 className="text-xl sm:text-2xl font-extrabold font-poppins text-dreamNavy">Create Account</h2>
                  <p className="text-[11px] sm:text-xs text-dreamMuted">Register your email to begin your customized recovery sleep cycle configuration.</p>
                </div>

                {/* Google Sign In Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
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
                  <span className="text-[9px] font-extrabold uppercase text-dreamMuted tracking-wider">or sign up with email</span>
                  <div className="h-[1px] bg-dreamBorder flex-1"></div>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-dreamRed/10 border border-dreamRed/20 text-dreamRed text-xs font-bold rounded-premium leading-relaxed text-left">
                    ⚠️ {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
                  {/* Name field */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-dreamNavy tracking-wider">Full Name</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dreamMuted">
                        <User className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full h-10 pl-9 pr-4 bg-white border border-dreamBorder rounded-premium text-xs text-dreamNavy placeholder-dreamMuted/70 focus:outline-none focus:border-dreamAccent focus:ring-1 focus:ring-dreamAccent transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Email field */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-dreamNavy tracking-wider">Email Address</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dreamMuted">
                        <Mail className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="email"
                        required
                        placeholder="name@domain.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-10 pl-9 pr-4 bg-white border border-dreamBorder rounded-premium text-xs text-dreamNavy placeholder-dreamMuted/70 focus:outline-none focus:border-dreamAccent focus:ring-1 focus:ring-dreamAccent transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Password field */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-dreamNavy tracking-wider">Password</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dreamMuted">
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-10 pl-9 pr-9 bg-white border border-dreamBorder rounded-premium text-xs text-dreamNavy placeholder-dreamMuted/70 focus:outline-none focus:border-dreamAccent focus:ring-1 focus:ring-dreamAccent transition-all shadow-sm"
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

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-10 bg-dreamAccent hover:bg-dreamAccent-dark disabled:bg-dreamAccent/50 text-xs font-bold text-white rounded-premium flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                  >
                    {loading ? 'Sending Verification...' : 'Sign Up'}
                    {!loading && <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                </form>

                <div className="mt-4 pt-4 border-t border-dreamBorder text-center">
                  <p className="text-[11px] text-dreamMuted">
                    Already have an account?{' '}
                    <Link to="/login" className="text-dreamAccent hover:underline font-bold">
                      Sign in here
                    </Link>
                  </p>
                </div>
              </>
            )}

            {/* 2. Step: OTP verification gate */}
            {step === 'otp' && (
              <div className="space-y-6 text-left">
                <div className="space-y-1.5">
                  <h2 className="text-xl sm:text-2xl font-extrabold font-poppins text-dreamNavy">Security Check</h2>
                  <p className="text-[11px] sm:text-xs text-dreamMuted leading-relaxed">
                    We've sent a 6-digit verification code to <strong className="text-dreamNavy">{email}</strong>. Please enter the security code below to finalize your registration.
                  </p>
                </div>

                {/* Dev sandbox OTP helper display */}
                {dispatchedOtp && (
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
                  {/* 6 Grid inputs */}
                  <div className="flex gap-2.5 justify-center">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpRefs.current[idx] = el)}
                        type="text"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="w-11 h-12 border border-dreamBorder bg-white rounded-premium text-center font-bold text-lg text-dreamNavy focus:outline-none focus:border-dreamAccent focus:ring-1 focus:ring-dreamAccent transition-all shadow-sm"
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-10 bg-dreamNavy hover:bg-dreamNavy/90 disabled:bg-dreamNavy/50 text-xs font-bold text-white rounded-premium flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                  >
                    {loading ? 'Verifying Identity...' : 'Verify Code & Create Account'}
                    {!loading && <ShieldCheck className="w-3.5 h-3.5" />}
                  </button>
                </form>

                <div className="text-center pt-2">
                  {resendTimer > 0 ? (
                    <p className="text-[10px] text-dreamMuted">
                      Resend code in <strong className="text-dreamNavy">{resendTimer}s</strong>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="text-[10px] text-dreamAccent hover:underline font-extrabold flex items-center gap-1.5 mx-auto"
                    >
                      <KeySquare className="w-3 h-3" />
                      Resend Verification Code
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>
        </ScrollReveal>
      </div>

    </div>
  );
}
