import React from 'react';
import { X, HelpCircle } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-100 transform transition-all animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-100 text-primary flex items-center justify-center shrink-0">
              <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">How SnackHub Works</h3>
              <p className="text-[11px] sm:text-xs text-slate-500">Quick 3-step kiosk guide</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 font-bold text-sm">
              1
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Select Snacks & Add to Cart</h4>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Browse our fresh snacks, cold beverages, and treats. Add items to your cart with real-time stock holds.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 font-bold text-sm">
              2
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Scan UPI QR & Pay</h4>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                A dynamic QR code is generated for your order. Scan with any UPI app (Google Pay, PhonePe, Paytm). Complete payment within 120 seconds.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-green-500 text-white flex items-center justify-center shrink-0 font-bold text-sm">
              3
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Pickup from Locker</h4>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Once paid, an automated locker pops open or assigns your locker compartment (e.g. L-07). Collect your snacks instantly!
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full py-3 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-2xl transition-all shadow-md shadow-blue-200"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};
