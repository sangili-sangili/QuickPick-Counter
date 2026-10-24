import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface StockErrorModalProps {
  isOpen: boolean;
  message?: string;
  onClose: () => void;
}

export const StockErrorModal: React.FC<StockErrorModalProps> = ({
  isOpen,
  message = 'Only 1 unit available for this product.',
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-sm w-full p-4 sm:p-6 shadow-2xl border border-slate-100 transform transition-all animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Not enough stock</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="mt-3 text-sm text-slate-600 leading-relaxed">
          {message}
        </p>

        <div className="mt-6 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl transition-all shadow-sm shadow-blue-200 active:scale-95"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
