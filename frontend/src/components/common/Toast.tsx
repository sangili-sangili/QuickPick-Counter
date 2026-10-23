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
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        let bgStyle = 'bg-white border-slate-200 text-slate-800';
        let icon = <Info className="w-5 h-5 text-blue-500 shrink-0" />;

        switch (toast.type) {
          case 'success':
            bgStyle = 'bg-white border-green-200 text-slate-800 shadow-lg';
            icon = (
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0 text-white">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            );
            break;
          case 'info':
            bgStyle = 'bg-white border-blue-200 text-slate-800 shadow-lg';
            icon = (
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shrink-0 text-white">
                <Info className="w-4 h-4" />
              </div>
            );
            break;
          case 'warning':
            bgStyle = 'bg-white border-amber-200 text-slate-800 shadow-lg';
            icon = (
              <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center shrink-0 text-white">
                <AlertTriangle className="w-4 h-4" />
              </div>
            );
            break;
          case 'error':
            bgStyle = 'bg-white border-red-200 text-slate-800 shadow-lg';
            icon = (
              <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shrink-0 text-white">
                <XCircle className="w-4 h-4" />
              </div>
            );
            break;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border ${bgStyle} shadow-soft transition-all duration-300 animate-in fade-in slide-in-from-top-4`}
          >
            <div className="flex items-center gap-3">
              {icon}
              <div className="text-sm font-medium leading-tight">
                {toast.message}
              </div>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1 -mr-1"
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
