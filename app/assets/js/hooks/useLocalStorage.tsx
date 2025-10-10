import { CacheManager } from "@/routes/CacheManager";

export function useLocalStorage(key: string) {
  const setItem = (value) => {
    const success = CacheManager.setItem(key, JSON.stringify(value));
    if (!success) {
      console.warn(`Failed to store value in localStorage for key: ${key}`);
    }
  };

  const getItem = () => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : undefined;
  };

  const removeItem = () => {
    CacheManager.removeItem(key);
  };

  return { setItem, getItem, removeItem };
}
