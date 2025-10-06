import React from "react";

import { useLocalStorage } from "./useLocalStorage";

type Serializer<T> = (value: T) => string;
type Deserializer<T> = (value: string) => T;

interface Options<T> {
  serialize?: Serializer<T>;
  deserialize?: Deserializer<T>;
}

const DEFAULT_SERIALIZER: Serializer<unknown> = (value) => JSON.stringify(value);
const DEFAULT_DESERIALIZER: Deserializer<unknown> = (value) => JSON.parse(value);

export function useStateWithLocalStorage<T>(
  namespace: string,
  key: string,
  initialValue: T,
  options?: Options<T>,
) {
  const serialize = React.useCallback<Serializer<T>>(
    (value) => (options?.serialize ? options.serialize(value) : (DEFAULT_SERIALIZER(value) as string)),
    [options?.serialize],
  );

  const deserialize = React.useCallback<Deserializer<T>>(
    (value) => (options?.deserialize ? options.deserialize(value) : (DEFAULT_DESERIALIZER(value) as T)),
    [options?.deserialize],
  );

  const storageKey = `${namespace}:${key}`;
  const { getItem, setItem } = useLocalStorage(storageKey);

  const [state, setState] = React.useState<T>(() => {
    try {
      const storedValue = getItem();

      if (storedValue !== null) {
        return deserialize(storedValue);
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${storageKey}":`, error);
      setItem(null);
    }

    return initialValue;
  });

  const setStateAndPersist = React.useCallback(
    (value: T | ((prev: T) => T)) => {
      setState((currentValue) => {
        const nextValue = typeof value === "function" ? (value as (prev: T) => T)(currentValue) : value;

        try {
          const serializedValue = serialize(nextValue);
          setItem(serializedValue);
        } catch (error) {
          console.error(`Error writing localStorage key "${storageKey}":`, error);
        }

        return nextValue;
      });
    },
    [serialize, setItem, storageKey],
  );

  return [state, setStateAndPersist] as const;
}
