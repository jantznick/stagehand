import { useState, useEffect } from 'react';

/**
 * A custom hook to debounce a value.
 * @param {*} value The value to debounce.
 * @param {number} delay The debounce delay in milliseconds.
 * @returns The debounced value.
 */
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function to cancel the timeout if value changes
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;