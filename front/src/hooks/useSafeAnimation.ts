// hooks/useSafeAnimation.ts
import { useEffect, useRef, useState } from 'react';

export const useSafeAnimation = () => {
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const safeSetState = useState(undefined)[1];

  return {
    isMounted: () => isMounted.current,
    safeSetState
  };
};