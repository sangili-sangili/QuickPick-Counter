import React from 'react';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';
import { ToastMessage } from '../../types';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-3 sm:top-5 inset-x-3 sm:inset-x-auto sm:left-auto sm:right-5 z-50 flex flex-col gap-2 max-w-sm w-auto sm:w-full pointer-events-none mx-auto sm:mx-0">
      {toasts.map((toast) => {
        let bgStyle = 'bg-white border-[#EFE8DE] text-stone-800 shadow-xl';
        let icon = <Info className="w-5 h-5 text-blue-500 shrink-0" />;

        switch (toast.type) {
          case 'success':
            bgStyle = 'bg-white border-emerald-200 text-stone-800 shadow-xl shadow-emerald-500/10';
            icon = (
              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-white shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            );
            break;
          case 'info':
            bgStyle = 'bg-white border-blue-200 text-stone-800 shadow-xl shadow-blue-500/10';
            icon = (
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shrink-0 text-white shadow-xs">
                <Info className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            );
            break;
          case 'warning':
            bgStyle = 'bg-white border-amber-200 text-stone-800 shadow-xl shadow-amber-500/10';
            icon = (
              <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center shrink-0 text-white shadow-xs">
                <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            );
            break;
          case 'error':
            bgStyle = 'bg-white border-red-200 text-stone-800 shadow-xl shadow-red-500/10';
            icon = (
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 text-white shadow-xs">
                <XCircle className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            );
            break;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border ${bgStyle} transition-all duration-300 animate-in fade-in slide-in-from-top-3 w-full min-w-0 gap-2.5 backdrop-blur-xs`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {icon}
              <div className="text-xs sm:text-sm font-bold text-stone-800 truncate">
                {toast.message}
              </div>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-stone-400 hover:text-stone-700 transition-colors p-1 rounded-xl hover:bg-stone-100 shrink-0 cursor-pointer"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
