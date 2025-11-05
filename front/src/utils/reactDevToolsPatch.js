// Патч для React DevTools чтобы предотвратить ошибки removeChild
if (process.env.NODE_ENV === 'development') {
  const originalConsoleError = console.error;
  
  console.error = (...args) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('removeChild')) {
      // Игнорируем ошибки removeChild в development
      return;
    }
    originalConsoleError.apply(console, args);
  };
}