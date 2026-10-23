import React, { useState } from 'react';
import { X, Mail, Lock, Phone, User, Eye, EyeOff, Sparkles, CheckCircle2 } from 'lucide-react';
import { CustomerUser } from '../../types';
import { customerLoginAPI, customerRegisterAPI } from '../../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: CustomerUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);

  // Sign In state
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up state
  const [signUpName, setSignUpName] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Error & loading state
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleQuickDemoLogin = async () => {
    setIsLoading(true);
    setErrorMessage('');
    const result = await customerLoginAPI('alex.j@snackhub.in', 'password123');
    setIsLoading(false);

    if (result.success && result.user) {
      onLoginSuccess(result.user);
      onClose();
    } else {
      setErrorMessage(result.error || 'Demo login failed');
    }
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!signInIdentifier.trim()) {
      setErrorMessage('Please enter your mobile number or email.');
      return;
    }
    if (!signInPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    const result = await customerLoginAPI(signInIdentifier.trim(), signInPassword);
    setIsLoading(false);

    if (result.success && result.user) {
      onLoginSuccess(result.user);
      onClose();
    } else {
      setErrorMessage(result.error || 'Invalid email or password');
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!signUpName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!signUpPhone.trim() || signUpPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!signUpEmail.trim() || !signUpEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!signUpPassword || signUpPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    if (!agreeTerms) {
      setErrorMessage('Please agree to the Terms of Service to continue.');
      return;
    }

    setIsLoading(true);
    const result = await customerRegisterAPI(
      signUpName.trim(),
      signUpEmail.trim(),
      signUpPassword,
      signUpPhone.trim()
    );
    setIsLoading(false);

    if (result.success && result.user) {
      onLoginSuccess(result.user);
      onClose();
    } else {
      setErrorMessage(result.error || 'Registration failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-[#EFE8DE] transform transition-all animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="px-6 pt-5 pb-3 border-b border-[#EFE8DE] flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-amber-500 flex items-center justify-center text-white shadow-xs">
              <span className="text-base">🍿</span>
            </div>
            <div>
              <h3 className="text-base font-black text-stone-900 tracking-tight leading-none">
                Snack<span className="text-primary">Hub</span> Account
              </h3>
              <p className="text-[11px] text-stone-400 font-medium mt-0.5">
                Kiosk Express Access & Order History
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl border border-[#EFE8DE] text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Toggle Switcher */}
        <div className="px-6 pt-4 pb-1 shrink-0 bg-white">
          <div className="p-1 rounded-2xl bg-[#FAF5EF] border border-[#EFE8DE] grid grid-cols-2 gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('signin');
                setErrorMessage('');
              }}
              className={`py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'signin'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('signup');
                setErrorMessage('');
              }}
              className={`py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'signup'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Register
            </button>
          </div>
        </div>

        {/* Error notification banner if any */}
        {errorMessage && (
          <div className="mx-6 mt-3 px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
            {errorMessage}
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin">
          {activeTab === 'signin' ? (
            /* Sign In Form */
            <form onSubmit={handleSignInSubmit} className="space-y-3.5">
              {/* Quick Demo Login Option */}
              <button
                type="button"
                onClick={handleQuickDemoLogin}
                className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-200/80 flex items-center justify-between hover:bg-red-100/60 active:scale-98 transition-all group cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-primary text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-bold text-stone-900 block group-hover:text-primary transition-colors">
                      1-Click Demo Login
                    </span>
                    <span className="text-[10px] text-stone-500 font-medium truncate block">
                      Alex Johnson • Gold Kiosk Member
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-primary text-white text-[10px] font-bold shadow-xs shrink-0">
                  Quick Fill
                </span>
              </button>

              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-[#EFE8DE] w-full" />
                <span className="bg-white px-3 text-[11px] font-semibold text-stone-400 uppercase tracking-wider absolute">
                  or with password
                </span>
              </div>

              {/* Identifier Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">
                  Mobile Number or Email
                </label>
                <div className="flex items-center bg-[#FAF5EF] border border-[#EFE8DE] rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                  <User className="w-4 h-4 text-stone-400 mr-2.5 shrink-0" />
                  <input
                    type="text"
                    value={signInIdentifier}
                    onChange={(e) => setSignInIdentifier(e.target.value)}
                    placeholder="9876543210 or name@mail.com"
                    className="w-full bg-transparent text-xs focus:outline-none text-stone-800 placeholder:text-stone-400 font-medium"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-700">Password</label>
                  <button
                    type="button"
                    onClick={() => setErrorMessage('Demo password is: snackhub123')}
                    className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="flex items-center bg-[#FAF5EF] border border-[#EFE8DE] rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                  <Lock className="w-4 h-4 text-stone-400 mr-2.5 shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-transparent text-xs focus:outline-none text-stone-800 placeholder:text-stone-400 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-stone-400 hover:text-stone-600 transition-colors ml-2"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2 pt-0.5">
                <input
                  type="checkbox"
                  id="remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#EFE8DE] text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer accent-primary"
                />
                <label htmlFor="remember-me" className="text-xs text-stone-600 font-medium cursor-pointer">
                  Keep me signed in on this kiosk session
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-2xl bg-primary hover:bg-primary-hover active:scale-98 text-white font-black text-xs sm:text-sm shadow-md shadow-red-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Sign In to SnackHub</span>
                )}
              </button>
            </form>
          ) : (
            /* Sign Up / Register Form */
            <form onSubmit={handleSignUpSubmit} className="space-y-3">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Full Name</label>
                <div className="flex items-center bg-[#FAF5EF] border border-[#EFE8DE] rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                  <User className="w-4 h-4 text-stone-400 mr-2.5 shrink-0" />
                  <input
                    type="text"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    placeholder="Alex Johnson"
                    className="w-full bg-transparent text-xs focus:outline-none text-stone-800 placeholder:text-stone-400 font-medium"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Mobile Number (India +91)</label>
                <div className="flex items-center bg-[#FAF5EF] border border-[#EFE8DE] rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                  <Phone className="w-4 h-4 text-stone-400 mr-2.5 shrink-0" />
                  <span className="text-xs font-bold text-stone-500 mr-2">+91</span>
                  <input
                    type="tel"
                    value={signUpPhone}
                    onChange={(e) => setSignUpPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    maxLength={10}
                    className="w-full bg-transparent text-xs focus:outline-none text-stone-800 placeholder:text-stone-400 font-medium"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Email Address</label>
                <div className="flex items-center bg-[#FAF5EF] border border-[#EFE8DE] rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                  <Mail className="w-4 h-4 text-stone-400 mr-2.5 shrink-0" />
                  <input
                    type="email"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full bg-transparent text-xs focus:outline-none text-stone-800 placeholder:text-stone-400 font-medium"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Password</label>
                <div className="flex items-center bg-[#FAF5EF] border border-[#EFE8DE] rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                  <Lock className="w-4 h-4 text-stone-400 mr-2.5 shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full bg-transparent text-xs focus:outline-none text-stone-800 placeholder:text-stone-400 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-stone-400 hover:text-stone-600 transition-colors ml-2"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="agree-terms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="rounded border-[#EFE8DE] text-primary focus:ring-primary h-3.5 w-3.5 mt-0.5 cursor-pointer accent-primary"
                />
                <label htmlFor="agree-terms" className="text-[11px] text-stone-500 font-medium leading-tight cursor-pointer">
                  I agree to SnackHub kiosk Terms of Service and Privacy Policy.
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-2xl bg-primary hover:bg-primary-hover active:scale-98 text-white font-black text-xs sm:text-sm shadow-md shadow-red-200 transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Create SnackHub Account</span>
                )}
              </button>
            </form>
          )}

          {/* Member Perks Notice */}
          <div className="pt-2">
            <div className="p-3 rounded-2xl bg-[#FAF5EF] border border-[#EFE8DE] flex items-center gap-2.5 text-xs text-stone-600">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              <span className="text-[11px] font-medium leading-snug">
                Members unlock fast 1-tap locker dispense and exclusive combo rewards.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
