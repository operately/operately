import {
  getLocalStorage,
  safeGetItem,
  safeRemoveItem,
  safeSetItem,
} from "@/utils/safeLocalStorage";

export function useLocalStorage(key: string) {
  const storage = getLocalStorage();
  const context = `useLocalStorage(${key})`;

  const setItem = (value: string | null | undefined) => {
    if (value === null || typeof value === "undefined") {
      // Treat null/undefined as a request to clear storage so state stays in sync.
      safeRemoveItem(storage, key, context);
      return;
    }

    const result = safeSetItem(storage, key, value, context);

    if (!result.success && result.quotaExceeded) {
      // Drop the key entirely so follow-up reads do not surface stale data.
      safeRemoveItem(storage, key, context);
    }
  };

  const getItem = (): string | undefined => {
    const raw = safeGetItem(storage, key, context);

    if (!raw) {
      return undefined;
    }

    return raw;
  };

  const removeItem = () => {
    safeRemoveItem(storage, key, context);
  };

  return { setItem, getItem, removeItem };
}
