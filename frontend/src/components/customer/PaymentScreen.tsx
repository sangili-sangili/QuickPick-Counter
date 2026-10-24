import React, { useState, useEffect } from 'react';
import {
  Check,
  Info,
  Copy,
  Zap,
} from 'lucide-react';
import { Order } from '../../types';
import { formatRupees } from '../../utils/format';

interface PaymentScreenProps {
  order: Order;
  onCancelOrderClick: () => void;
  onSimulateSuccess: () => void;
  onSimulateExpire: () => void;
  onOrderExpired: () => void;
}

export const PaymentScreen: React.FC<PaymentScreenProps> = ({
  order,
  onCancelOrderClick,
  onSimulateSuccess,
  onSimulateExpire,
  onOrderExpired,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(order.expiresInSeconds || 120);
  const totalSeconds = 120;
  const [copied, setCopied] = useState(false);

  // Independent countdown timer
  useEffect(() => {
    // calculate exact time based on target expiresAt
    const updateCountdown = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((order.expiresAt - now) / 1000));
      setSecondsRemaining(diff);

      if (diff <= 0) {
        onOrderExpired();
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [order.expiresAt, onOrderExpired]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // SVG Circular progress math
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = Math.max(0, Math.min(1, secondsRemaining / totalSeconds));
  const strokeDashoffset = circumference - progressRatio * circumference;

  let timerColor = 'text-primary';
  let timerStroke = '#E2231A';
  if (secondsRemaining <= 30) {
    timerColor = 'text-red-600';
    timerStroke = '#DC2626';
  } else if (secondsRemaining <= 60) {
    timerColor = 'text-amber-500';
    timerStroke = '#F59E0B';
  }

  const handleCopyOrderId = () => {
    navigator.clipboard?.writeText(order.orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto px-2.5 sm:px-4 py-3 sm:py-8 space-y-4 sm:space-y-6 w-full min-w-0">
      {/* 4-Step Progress Stepper */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-6 border border-slate-100 shadow-soft">
        <div className="grid grid-cols-4 items-center text-center relative gap-1">
          {/* Connector line */}
          <div className="absolute top-3 sm:top-4 left-[10%] right-[10%] h-0.5 bg-slate-200 -z-0" />
          <div
            className="absolute top-3 sm:top-4 left-[10%] h-0.5 bg-primary -z-0 transition-all duration-500"
            style={{ width: '40%' }}
          />

          {/* Step 1: Order Placed */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[10px] sm:text-xs shadow-sm">
              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <span className="text-[9px] sm:text-xs font-semibold text-slate-800 mt-1 sm:mt-2 leading-tight">Order Placed</span>
          </div>

          {/* Step 2: Make Payment (Active) */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[10px] sm:text-xs shadow-sm ring-2 sm:ring-4 ring-red-100 animate-pulse">
              2
            </div>
            <span className="text-[9px] sm:text-xs font-bold text-primary mt-1 sm:mt-2 leading-tight">Payment</span>
          </div>

          {/* Step 3: Processing */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white border-2 border-slate-200 text-slate-400 flex items-center justify-center font-bold text-[10px] sm:text-xs">
              3
            </div>
            <span className="text-[9px] sm:text-xs font-medium text-slate-400 mt-1 sm:mt-2 leading-tight">Processing</span>
          </div>

          {/* Step 4: Pickup */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white border-2 border-slate-200 text-slate-400 flex items-center justify-center font-bold text-[10px] sm:text-xs">
              4
            </div>
            <span className="text-[9px] sm:text-xs font-medium text-slate-400 mt-1 sm:mt-2 leading-tight">Pickup</span>
          </div>
        </div>
      </div>

      {/* Main Payment Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-slate-100 shadow-soft text-center space-y-4 sm:space-y-6 w-full min-w-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Scan & Pay with UPI
          </h2>
          <div className="mt-3 flex items-baseline justify-center gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {formatRupees(order.totalPaise, true)}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <span>Order #{order.orderNumber}</span>
            <button
              onClick={handleCopyOrderId}
              className="text-slate-400 hover:text-primary transition-colors p-0.5"
              title="Copy Order ID"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            {copied && <span className="text-[10px] text-green-600 font-bold">Copied!</span>}
          </div>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center">
          <div className="p-3 sm:p-4 bg-white rounded-2xl sm:rounded-3xl border-2 border-dashed border-slate-200 shadow-sm relative group">
            {/* SVG generated UPI QR Code */}
            <svg
              className="w-40 h-40 sm:w-56 sm:h-56"
              viewBox="0 0 200 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* QR Finder patterns */}
              <rect width="200" height="200" fill="white" />
              {/* Top-left position marker */}
              <rect x="15" y="15" width="50" height="50" rx="6" fill="#0F172A" />
              <rect x="23" y="23" width="34" height="34" rx="4" fill="white" />
              <rect x="31" y="31" width="18" height="18" rx="2" fill="#0F172A" />

              {/* Top-right position marker */}
              <rect x="135" y="15" width="50" height="50" rx="6" fill="#0F172A" />
              <rect x="143" y="23" width="34" height="34" rx="4" fill="white" />
              <rect x="151" y="31" width="18" height="18" rx="2" fill="#0F172A" />

              {/* Bottom-left position marker */}
              <rect x="15" y="135" width="50" height="50" rx="6" fill="#0F172A" />
              <rect x="23" y="143" width="34" height="34" rx="4" fill="white" />
              <rect x="31" y="151" width="18" height="18" rx="2" fill="#0F172A" />

              {/* Synthetic decorative QR data grid cells */}
              <rect x="75" y="20" width="10" height="10" fill="#0F172A" />
              <rect x="95" y="20" width="10" height="10" fill="#0F172A" />
              <rect x="115" y="20" width="10" height="10" fill="#0F172A" />
              <rect x="75" y="40" width="20" height="10" fill="#0F172A" />
              <rect x="105" y="40" width="15" height="10" fill="#0F172A" />
              <rect x="80" y="60" width="10" height="10" fill="#0F172A" />
              <rect x="100" y="60" width="20" height="10" fill="#0F172A" />

              <rect x="20" y="75" width="15" height="10" fill="#0F172A" />
              <rect x="45" y="75" width="10" height="10" fill="#0F172A" />
              <rect x="20" y="95" width="10" height="20" fill="#0F172A" />
              <rect x="40" y="105" width="15" height="10" fill="#0F172A" />

              <rect x="140" y="75" width="10" height="20" fill="#0F172A" />
              <rect x="160" y="85" width="20" height="10" fill="#0F172A" />
              <rect x="145" y="105" width="25" height="10" fill="#0F172A" />

              {/* Center UPI logo overlay */}
              <rect x="70" y="70" width="60" height="60" rx="14" fill="white" filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.1))" />
              <text
                x="100"
                y="107"
                textAnchor="middle"
                fontSize="18"
                fontWeight="900"
                fill="#E2231A"
                fontFamily="sans-serif"
              >
                UPI
              </text>

              {/* Bottom data dots */}
              <rect x="75" y="140" width="15" height="10" fill="#0F172A" />
              <rect x="100" y="140" width="10" height="20" fill="#0F172A" />
              <rect x="120" y="140" width="15" height="10" fill="#0F172A" />
              <rect x="80" y="165" width="25" height="10" fill="#0F172A" />
              <rect x="115" y="165" width="20" height="10" fill="#0F172A" />
              <rect x="150" y="140" width="10" height="10" fill="#0F172A" />
              <rect x="170" y="145" width="10" height="20" fill="#0F172A" />
              <rect x="145" y="170" width="20" height="10" fill="#0F172A" />
            </svg>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 tracking-wider">UPI</span>
            <span className="text-xs text-slate-400 font-medium">
              Scan this QR code with any UPI app
            </span>
          </div>

          {/* Supported UPI Apps Badges */}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-semibold text-slate-500">
            <span className="px-2 py-0.5 rounded-md bg-slate-100">GPay</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100">PhonePe</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100">Paytm</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100">BHIM</span>
          </div>
        </div>

        {/* Circular Countdown Progress Ring */}
        <div className="flex flex-col items-center justify-center pt-2">
          <p className="text-xs text-slate-400 font-medium mb-2">Order expires in</p>
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-slate-100"
                strokeWidth="6"
                fill="none"
              />
              {/* Active countdown stroke */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke={timerStroke}
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-base font-bold ${timerColor} tracking-tight`}>
                {formattedTime}
              </span>
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                remaining
              </span>
            </div>
          </div>
        </div>

        {/* Notice Info Banner */}
        <div className="p-3.5 rounded-2xl bg-red-50/70 border border-red-100 text-left flex items-center gap-3">
          <Info className="w-5 h-5 text-primary shrink-0" />
          <p className="text-xs text-slate-600 leading-relaxed">
            After payment, your order will be confirmed automatically. Please keep this screen open.
          </p>
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onCancelOrderClick}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            Cancel Order
          </button>
        </div>
      </div>

      {/* Developer / Testing Simulator Banner */}
      <div className="w-full max-w-xl mx-auto bg-stone-900 text-white rounded-2xl p-3 sm:p-4 shadow-xl border border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 text-xs box-border">
        <div className="flex items-center gap-2 self-start sm:self-center">
          <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
          <div className="leading-tight">
            <span className="font-bold text-stone-200">Test Simulator: </span>
            <span className="text-stone-400 text-[10px] sm:text-[11px]">Quick actions</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto shrink-0">
          <button
            onClick={onSimulateSuccess}
            className="w-full sm:w-auto px-3 py-2 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm active:scale-95 transition-all text-[11px] sm:text-xs text-center cursor-pointer"
          >
            ✓ Simulate Paid
          </button>
          <button
            onClick={onSimulateExpire}
            className="w-full sm:w-auto px-3 py-2 rounded-xl font-bold bg-stone-800 hover:bg-red-950/60 text-stone-200 hover:text-red-300 transition-all border border-stone-700 hover:border-red-800 active:scale-95 text-[11px] sm:text-xs text-center cursor-pointer"
          >
            ✕ Simulate Expire
          </button>
        </div>
      </div>
    </div>
  );
};
