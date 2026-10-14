import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Accessible Toast Notification Component (src/components/Toast.jsx)
 * Pairs color with explicit status icon & label for WCAG compliance.
 */
export default function ToastContainer({ toasts, onDismiss }) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const isError = toast.type === 'error';
          const isSuccess = toast.type === 'success';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md ${
                isError
                  ? 'bg-white/95 dark:bg-slate-900/95 border-red-200 dark:border-red-900/60 text-slate-900 dark:text-slate-100'
                  : isSuccess
                  ? 'bg-white/95 dark:bg-slate-900/95 border-emerald-200 dark:border-emerald-900/60 text-slate-900 dark:text-slate-100'
                  : 'bg-white/95 dark:bg-slate-900/95 border-blue-200 dark:border-blue-900/60 text-slate-900 dark:text-slate-100'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isError ? (
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" aria-hidden="true" />
                ) : isSuccess ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                ) : (
                  <Info className="w-5 h-5 text-[#2563EB] dark:text-blue-400" aria-hidden="true" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold tracking-tight text-slate-900 dark:text-white">
                  {isError ? 'Action Failed' : isSuccess ? 'Success' : 'Notice'}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                  {toast.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                aria-label="Dismiss notification"
                className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
