import { useState } from 'react';

// Custom hook for managing session storage
export const useSessionStorage = <T>(key: string, initialValue: T) => {
  // Retrieve the value from session storage or use the initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      // Parse the stored JSON or use the initial value if not found
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error retrieving session storage item:', error);
      return initialValue;
    }
  });

  // Function to set the value in session storage
  const setValue = (value: T) => {
    try {
      // Save the value to session storage
      setStoredValue(value);
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error setting session storage item:', error);
    }
  };

  // Function to remove the value from session storage
  const removeValue = () => {
    try {
      setStoredValue(initialValue);
      window.sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing session storage item:', error);
    }
  };

  return [storedValue, setValue, removeValue] as const;
};
