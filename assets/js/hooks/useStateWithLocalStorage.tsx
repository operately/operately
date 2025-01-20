import { useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface Options<T> {
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
}

const DEFAULT_OPTIONS: Options<any> = {
  serialize: JSON.stringify,
  deserialize: JSON.parse,
};

export function useStateWithLocalStorage<T>(namespace: string, key: string, initialValue?: T, options?: Options<T>) {
  options = { ...DEFAULT_OPTIONS, ...options };

  const { setItem, getItem } = useLocalStorage(`${namespace}:${key}`);

  const [value, setValue] = useState<T>(() => {
    try {
      const storedValue = getItem();

      if (storedValue) {
        return options.deserialize!(storedValue) as unknown as T;
      }

      return initialValue as T;
    } catch (error) {
      console.error(`Error reading localStorage: ${error}`);
      return initialValue as T;
    }
  });

  const setStateAndLocalStorageValue = (newValue: T | ((prevValue: T) => T)) => {
    setValue((currentValue) => {
      const updatedValue = typeof newValue === "function" ? (newValue as (prevValue: T) => T)(currentValue) : newValue;

      const serialized = options.serialize!(updatedValue);
      setItem(serialized);

      return updatedValue;
    });
  };

  return [value, setStateAndLocalStorageValue] as const;
}
