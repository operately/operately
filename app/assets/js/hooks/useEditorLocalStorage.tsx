import { useCallback, useRef } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useMe } from "@/contexts/CurrentCompanyContext";

interface UseEditorLocalStorageOptions {
  /**
   * Unique key for this editor instance. Should include context like:
   * "comment-new", "discussion-edit-123", "task-description-456", etc.
   */
  storageKey?: string;
  
  /**
   * Whether to enable localStorage functionality
   */
  enabled?: boolean;
}

/**
 * Hook to manage localStorage for rich text editors
 * Automatically saves content as user types and restores on mount
 */
export function useEditorLocalStorage({ storageKey, enabled = true }: UseEditorLocalStorageOptions = {}) {
  const me = useMe();
  const lastSavedContent = useRef<string | null>(null);
  
  // Create a user-specific storage key to prevent cross-user pollution
  const finalStorageKey = storageKey && me ? `editor:${me.id}:${storageKey}` : null;
  const { setItem, getItem, removeItem } = useLocalStorage(finalStorageKey || "");
  
  /**
   * Save content to localStorage
   */
  const saveContent = useCallback((content: any) => {
    if (!enabled || !finalStorageKey || !content) return;
    
    const contentJson = JSON.stringify(content);
    // Only save if content has actually changed to avoid unnecessary localStorage writes
    if (contentJson !== lastSavedContent.current) {
      setItem(content);
      lastSavedContent.current = contentJson;
    }
  }, [enabled, finalStorageKey, setItem]);
  
  /**
   * Get saved content from localStorage
   */
  const getSavedContent = useCallback(() => {
    if (!enabled || !finalStorageKey) return null;
    
    try {
      const content = getItem();
      if (content) {
        lastSavedContent.current = JSON.stringify(content);
        return content;
      }
    } catch (error) {
      console.warn("Failed to retrieve saved editor content:", error);
    }
    return null;
  }, [enabled, finalStorageKey, getItem]);
  
  /**
   * Clear saved content from localStorage
   * Should be called when content is successfully submitted
   */
  const clearSavedContent = useCallback(() => {
    if (!enabled || !finalStorageKey) return;
    
    removeItem();
    lastSavedContent.current = null;
  }, [enabled, finalStorageKey, removeItem]);
  
  /**
   * Check if there is saved content available
   */
  const hasSavedContent = useCallback(() => {
    if (!enabled || !finalStorageKey) return false;
    
    try {
      const content = getItem();
      return content !== null && content !== undefined;
    } catch {
      return false;
    }
  }, [enabled, finalStorageKey, getItem]);
  
  return {
    saveContent,
    getSavedContent,
    clearSavedContent,
    hasSavedContent,
    isEnabled: enabled && !!finalStorageKey,
  };
}