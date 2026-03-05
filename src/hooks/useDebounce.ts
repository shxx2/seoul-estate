import { useState, useEffect } from "react";

/**
 * 값의 변경을 지연시키는 디바운스 훅
 * @param value - 디바운스할 값
 * @param delay - 지연 시간 (ms), 기본값 300ms
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
