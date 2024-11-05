import { useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export function useStateWithLocalStorage<T>(key: string, initialValue?: T) {
  const { setItem, getItem } = useLocalStorage(key);
  const [value, setValue] = useState<T>(getItem() ?? initialValue);

  const setStateAndLocalStorageValue = (newValue: T | ((prevValue: T) => T)) => {
    setValue((currentValue) => {
      const updatedValue = typeof newValue === "function" ? (newValue as (prevValue: T) => T)(currentValue) : newValue;

      setItem(updatedValue);
      return updatedValue;
    });
  };

  return [value, setStateAndLocalStorageValue] as const;
}
