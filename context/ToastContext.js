'use client';
import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

let id = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type = 'info', message, duration = 3500 }) => {
    const tid = ++id;
    setToasts(prev => [...prev, { id: tid, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== tid)), duration);
  }, []);

  const remove = useCallback((tid) => {
    setToasts(prev => prev.filter(t => t.id !== tid));
  }, []);

  const icons = {
    success: <CheckCircle size={16} className="text-green-500 shrink-0" />,
    error:   <XCircle    size={16} className="text-red-500   shrink-0" />,
    warning: <AlertCircle size={16} className="text-amber-500 shrink-0" />,
    info:    <Info        size={16} className="text-blue-500  shrink-0" />,
  };

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0">
        {toasts.map(t => (
          <div
            key={t.id}
            className="flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border animate-slide-up"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
            }}
          >
            {icons[t.type]}
            <span className="text-sm flex-1 leading-snug">{t.message}</span>
            <button onClick={() => remove(t.id)} className="shrink-0 opacity-50 hover:opacity-100 transition-opacity">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
