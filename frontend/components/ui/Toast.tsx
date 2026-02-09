
 'use client';
 
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: React.ReactNode;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: React.ReactNode, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showToast = useCallback((message: React.ReactNode, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {mounted && createPortal(
        <div className="fixed top-20 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={cn(
                "pointer-events-auto flex items-center gap-3 min-w-[320px] p-4 rounded-2xl shadow-modal border border-neutral-100 animate-in slide-in-from-top-4 duration-300 bg-white",
                toast.type === 'success' && "text-accent-emerald",
                toast.type === 'error' && "text-accent-red",
                toast.type === 'info' && "text-primary"
              )}
            >
              {toast.type === 'success' && <CheckCircle className="w-5 h-5 stroke-[2.5]" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 stroke-[2.5]" />}
              {toast.type === 'info' && <Info className="w-5 h-5 stroke-[2.5]" />}
              <p className="text-sm font-black flex-1 text-neutral-900">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1.5 rounded-xl hover:bg-neutral-50 text-neutral-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
