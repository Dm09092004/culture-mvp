// hooks/useErrorHandler.ts
import { useEffect } from 'react';

export const useErrorHandler = () => {
  useEffect(() => {
    const handleRuntimeError = (event: ErrorEvent) => {
      if (event.error?.message?.includes('removeChild')) {
        event.preventDefault();
        console.warn('Предотвращена ошибка removeChild:', event.error);
        return true;
      }
      return false;
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('removeChild')) {
        event.preventDefault();
        console.warn('Предотвращена ошибка removeChild в промисах:', event.reason);
        return true;
      }
      return false;
    };

    window.addEventListener('error', handleRuntimeError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleRuntimeError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);
};