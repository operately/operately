// Shared helpers that insulate the rest of the app from storage errors.
// Centralizes all localStorage access behind guards:
// - getLocalStorage now returns null when the API is unavailable (SSR, privacy mode, exceptions);
// - safeGetItem, safeSetItem, and safeRemoveItem wrap the native calls, swallow quota errors, and log diagnostics only for unexpected failures.
// This lets callers treat storage as optional and react to quota exhaustion without blowing up.

const DEFAULT_CONTEXT = "localStorage";

function formatContext(context?: string): string {
  return context ? `${context}:` : DEFAULT_CONTEXT + ":";
}

export function getLocalStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

// Different browsers report quota exhaustion via different DOMException shapes.
export function isQuotaExceededError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  if (error instanceof DOMException) {
    return (
      error.code === 22 ||
      error.code === 1014 ||
      error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED"
    );
  }

  return false;
}

export function safeGetItem(storage: Storage | null, key: string, context?: string): string | null {
  if (!storage) {
    return null;
  }

  try {
    return storage.getItem(key);
  } catch (error) {
    if (!isQuotaExceededError(error)) {
      console.error(`${formatContext(context)} failed to read key "${key}"`, error);
    }

    return null;
  }
}

export interface SafeSetResult {
  success: boolean;
  quotaExceeded: boolean;
}

export function safeSetItem(storage: Storage | null, key: string, value: string, context?: string): SafeSetResult {
  if (!storage) {
    return { success: false, quotaExceeded: false };
  }

  try {
    storage.setItem(key, value);
    return { success: true, quotaExceeded: false };
  } catch (error) {
    if (!isQuotaExceededError(error)) {
      console.error(`${formatContext(context)} failed to write key "${key}"`, error);
      return { success: false, quotaExceeded: false };
    }

    return { success: false, quotaExceeded: true };
  }
}

export function safeRemoveItem(storage: Storage | null, key: string, context?: string): void {
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(key);
  } catch (error) {
    if (!isQuotaExceededError(error)) {
      console.error(`${formatContext(context)} failed to remove key "${key}"`, error);
    }
  }
}
