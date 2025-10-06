export function useLocalStorage(key: string) {
  const isBrowser = typeof window !== "undefined" && typeof window.localStorage !== "undefined";

  const setItem = (value: string | null) => {
    if (!isBrowser) return;

    if (value === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, value);
    }
  };

  const getItem = () => {
    if (!isBrowser) return null;

    return window.localStorage.getItem(key);
  };

  const removeItem = () => {
    if (!isBrowser) return;

    window.localStorage.removeItem(key);
  };

  return { setItem, getItem, removeItem };
}
