// contexts/ToastContext.tsx
import React, { createContext, useContext } from 'react';
import { useToast, Toast } from '../hooks/useToast';

const ToastContext = createContext<ReturnType<typeof useToast> | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const toast = useToast();

  return (
    <ToastContext.Provider value={toast}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};