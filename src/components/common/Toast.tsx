import React, { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  // duration es opcional; si es null, undefined o <= 0, el toast persiste hasta cierre manual
  duration?: number | null;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  isVisible,
  onClose,
  duration = null // Persistente por defecto para garantizar que el usuario lea el mensaje
}) => {
  useEffect(() => {
    if (isVisible && duration && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900/95 border border-emerald-500/50 text-white px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md animate-fade-in ring-1 ring-emerald-500/20 max-w-sm"
    >
      <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
        <CheckCircle2 className="w-5 h-5" />
      </div>
      <div className="text-xs font-semibold leading-snug flex-1">
        {message}
      </div>
      <button
        type="button"
        id="btn-close-toast"
        onClick={onClose}
        aria-label="Cerrar notificación"
        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
        title="Cerrar notificación"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
