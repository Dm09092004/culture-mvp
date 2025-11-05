// components/ToastContainer.tsx
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { useToast, Toast } from '../hooks/useToast';

const ToastIcon = ({ type }: { type: Toast['type'] }) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'error':
      return <XCircle className="w-5 h-5 text-red-500" />;
    case 'warning':
      return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    case 'info':
      return <Info className="w-5 h-5 text-blue-500" />;
    default:
      return <Info className="w-5 h-5 text-blue-500" />;
  }
};

// Исправляем функцию ToastBackground - теперь она принимает тип напрямую
const getToastBackground = (type: Toast['type']): string => {
  switch (type) {
    case 'success':
      return 'bg-green-50 border-green-200';
    case 'error':
      return 'bg-red-50 border-red-200';
    case 'warning':
      return 'bg-yellow-50 border-yellow-200';
    case 'info':
      return 'bg-blue-50 border-blue-200';
    default:
      return 'bg-blue-50 border-blue-200';
  }
};

export const ToastContainer = () => {
  const { toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            ${getToastBackground(toast.type)}
            border rounded-lg p-4 shadow-lg transition-all duration-300 ease-in-out
            transform hover:scale-105 hover:shadow-xl
            animate-in slide-in-from-right-full
          `}
        >
          <div className="flex items-start space-x-3">
            <ToastIcon type={toast.type} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};