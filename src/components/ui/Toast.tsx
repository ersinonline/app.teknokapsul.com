import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

interface ToastProps {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ type, message, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const config = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-gradient-to-r from-green-500 to-emerald-600',
      iconColor: 'text-white',
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-gradient-to-r from-red-500 to-pink-600',
      iconColor: 'text-white',
    },
    info: {
      icon: Info,
      bgColor: 'bg-gradient-to-r from-blue-500 to-cyan-600',
      iconColor: 'text-white',
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-gradient-to-r from-yellow-500 to-orange-600',
      iconColor: 'text-white',
    },
  };

  const { icon: Icon, bgColor, iconColor } = config[type];

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 
        ${bgColor} 
        text-white rounded-xl shadow-2xl
        px-6 py-4 
        flex items-center gap-3
        animate-slide-down
        max-w-md
        backdrop-blur-lg
      `}
    >
      <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0`} />
      <p className="text-sm font-medium flex-1">{message}</p>
      <button
        onClick={onClose}
        className="p-1 rounded-lg hover:bg-white/20 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Toast Container Component
interface ToastContainerProps {
  toasts: Array<{
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
  }>;
  onRemoveToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemoveToast }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          type={toast.type}
          message={toast.message}
          onClose={() => onRemoveToast(toast.id)}
        />
      ))}
    </div>
  );
};
