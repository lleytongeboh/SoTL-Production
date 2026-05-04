import { useState } from 'react';

/**
 * Example usage: Storing and retrieving a value in localStorage.
 * 
 * const [name, setName] = useLocalStorage<string>('name', 'John Doe');
 * 
 * return (
 *   <div>
 *     <input
 *       type="text"
 *       value={name}
 *       onChange={(e) => setName(e.target.value)}
 *     />
 *   </div>
 * );
 * 
 * @param key The key under which the value is stored in localStorage.
 * @param initialValue The initial value to set if nothing is found in localStorage.
 * @returns A stateful value, and a function to update it.
 */
function useLocalStorage<T>(key: string, initialValue: T) {
    const [storedValue, setStoredValue] = useState<T>(() => {
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
    } catch (error) {
        console.error(error);
        return initialValue;
    }
});

  const setValue = (value: T | ((val: T) => T)) => {
      try {
          const valueToStore = value instanceof Function ? value(storedValue) : value;
          setStoredValue(valueToStore);
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(error);
    }
};

return [storedValue, setValue] as const;
}

export default useLocalStorage;

