import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, ArrowLeft, Sparkles, AlertCircle } from 'lucide-react';
import { AdminUser } from '../../types';
import { adminLoginApi } from '../../services/adminApi';

interface AdminLoginProps {
  onLoginSuccess: (user: AdminUser) => void;
  onBackToKiosk: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
  onBackToKiosk,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Separate validation error states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleQuickFill = () => {
    setEmail('admin@quickpick.com');
    setPassword('admin123');
    setEmailError('');
    setPasswordError('');
    setGeneralError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');
    setGeneralError('');

    let hasLocalError = false;

    if (!email.trim()) {
      setEmailError('Please enter your admin email address.');
      hasLocalError = true;
    } else if (!email.includes('@')) {
      setEmailError('Please enter a valid email address.');
      hasLocalError = true;
    }

    if (!password) {
      setPasswordError('Please enter your admin password.');
      hasLocalError = true;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      hasLocalError = true;
    }

    if (hasLocalError) return;

    setIsLoading(true);
    const result = await adminLoginApi(email.trim(), password);
    setIsLoading(false);

    if (result.success && result.user) {
      onLoginSuccess(result.user);
    } else {
      // Handle separate backend validation errors
      if (result.field === 'email') {
        setEmailError(result.message || 'Email not recognized as administrator.');
      } else if (result.field === 'password') {
        setPasswordError(result.message || 'Incorrect password.');
      } else {
        setGeneralError(result.message || 'Authentication failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9F3] text-[#3D4127] flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Decorative subtle ambient circles */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-[#D4DE95]/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#BAC095]/30 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Kiosk Back Button */}
      <button
        type="button"
        onClick={onBackToKiosk}
        className="absolute top-6 left-6 px-4 py-2 rounded-2xl bg-white border border-[#E3E6D3] text-[#3D4127] hover:text-[#636B2F] font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
      >
        <ArrowLeft className="w-3.5 h-3.5 text-[#636B2F]" />
        <span>Return to Customer Kiosk</span>
      </button>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl p-7 sm:p-9 border border-[#E3E6D3] shadow-xl relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#636B2F] flex items-center justify-center text-white mx-auto shadow-md shadow-[#636B2F]/25 text-2xl">
            🍿
          </div>

          <div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-[#3D4127]">
                QuickPick<span className="text-[#636B2F]">Counter</span>
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-[#D4DE95] text-[#3D4127] text-[10px] font-black uppercase tracking-wider border border-[#BAC095]">
                Admin
              </span>
            </div>
            <p className="text-xs text-[#707550] font-medium mt-1">
              Smart Kiosk & Locker Administration Portal
            </p>
          </div>
        </div>

        {/* 1-Click Demo Fill Option */}
        <button
          type="button"
          onClick={handleQuickFill}
          className="w-full mb-4 p-3 rounded-2xl bg-[#F8F9F3] border border-[#E3E6D3] hover:border-[#636B2F]/40 flex items-center justify-between text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-[#636B2F] text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#3D4127] block group-hover:text-[#636B2F] transition-colors">
                Auto-Fill Demo Credentials
              </span>
              <span className="text-[10px] text-[#707550] font-medium block">
                admin@quickpick.com • admin123
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-[#636B2F] text-white text-[10px] font-bold shadow-2xs">
            Fill
          </span>
        </button>

        {/* General Error Alert */}
        {generalError && (
          <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field with Dedicated Validation */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#3D4127]">Admin Email Address</label>
            <div
              className={`flex items-center rounded-2xl px-3.5 py-2.5 transition-all border ${
                emailError
                  ? 'bg-red-50/50 border-red-400 ring-2 ring-red-200'
                  : 'bg-[#F8F9F3] border-[#E3E6D3] focus-within:ring-2 focus-within:ring-[#636B2F]/20 focus-within:border-[#636B2F]'
              }`}
            >
              <Mail className={`w-4 h-4 mr-2.5 shrink-0 ${emailError ? 'text-red-500' : 'text-[#707550]'}`} />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError('');
                  setGeneralError('');
                }}
                placeholder="admin@quickpick.com"
                className="w-full bg-transparent text-xs sm:text-sm font-semibold focus:outline-none text-[#3D4127] placeholder:text-[#A0A580]"
              />
            </div>
            {emailError && (
              <p className="text-[11px] text-red-600 font-bold flex items-center gap-1 mt-1 animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{emailError}</span>
              </p>
            )}
          </div>

          {/* Password Field with Dedicated Validation */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#3D4127]">Password</label>
              <button
                type="button"
                onClick={() => {
                  setPassword('admin123');
                  setPasswordError('');
                }}
                className="text-[11px] font-bold text-[#636B2F] hover:underline cursor-pointer"
              >
                Demo: admin123
              </button>
            </div>
            <div
              className={`flex items-center rounded-2xl px-3.5 py-2.5 transition-all border ${
                passwordError
                  ? 'bg-red-50/50 border-red-400 ring-2 ring-red-200'
                  : 'bg-[#F8F9F3] border-[#E3E6D3] focus-within:ring-2 focus-within:ring-[#636B2F]/20 focus-within:border-[#636B2F]'
              }`}
            >
              <Lock className={`w-4 h-4 mr-2.5 shrink-0 ${passwordError ? 'text-red-500' : 'text-[#707550]'}`} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                  setGeneralError('');
                }}
                placeholder="Enter password"
                className="w-full bg-transparent text-xs sm:text-sm font-semibold focus:outline-none text-[#3D4127] placeholder:text-[#A0A580]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[#707550] hover:text-[#3D4127] transition-colors ml-2 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordError && (
              <p className="text-[11px] text-red-600 font-bold flex items-center gap-1 mt-1 animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{passwordError}</span>
              </p>
            )}
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-2xl bg-[#636B2F] hover:bg-[#525927] active:scale-98 text-white font-black text-xs sm:text-sm shadow-md shadow-[#636B2F]/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-70"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In to Admin Console</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </>
            )}
          </button>
        </form>

        {/* Security badge */}
        <div className="mt-6 pt-4 border-t border-[#E3E6D3] flex items-center justify-center gap-2 text-xs text-[#707550] font-medium">
          <ShieldCheck className="w-4 h-4 text-[#636B2F]" />
          <span>256-Bit SSL Encrypted Kiosk Management</span>
        </div>
      </div>
    </div>
  );
};
