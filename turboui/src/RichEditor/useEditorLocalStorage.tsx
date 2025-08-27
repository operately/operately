import { useCallback, useRef } from "react";

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

  /**
   * Current user ID for namespacing storage
   */
  userId?: string;
}

/**
 * Hook to manage localStorage for rich text editors in turboui
 * Automatically saves content as user types and restores on mount
 */
export function useEditorLocalStorage({ storageKey, enabled = true, userId }: UseEditorLocalStorageOptions = {}) {
  const lastSavedContent = useRef<string | null>(null);
  
  // Create a user-specific storage key to prevent cross-user pollution
  const finalStorageKey = storageKey && userId ? `editor:${userId}:${storageKey}` : null;
  
  /**
   * Save content to localStorage
   */
  const saveContent = useCallback((content: any) => {
    if (!enabled || !finalStorageKey || !content) return;
    
    const contentJson = JSON.stringify(content);
    // Only save if content has actually changed to avoid unnecessary localStorage writes
    if (contentJson !== lastSavedContent.current) {
      try {
        localStorage.setItem(finalStorageKey, contentJson);
        lastSavedContent.current = contentJson;
      } catch (error) {
        console.warn("Failed to save editor content to localStorage:", error);
      }
    }
  }, [enabled, finalStorageKey]);
  
  /**
   * Get saved content from localStorage
   */
  const getSavedContent = useCallback(() => {
    if (!enabled || !finalStorageKey) return null;
    
    try {
      const content = localStorage.getItem(finalStorageKey);
      if (content) {
        const parsed = JSON.parse(content);
        lastSavedContent.current = content;
        return parsed;
      }
    } catch (error) {
      console.warn("Failed to retrieve saved editor content:", error);
    }
    return null;
  }, [enabled, finalStorageKey]);
  
  /**
   * Clear saved content from localStorage
   * Should be called when content is successfully submitted
   */
  const clearSavedContent = useCallback(() => {
    if (!enabled || !finalStorageKey) return;
    
    try {
      localStorage.removeItem(finalStorageKey);
      lastSavedContent.current = null;
    } catch (error) {
      console.warn("Failed to clear saved editor content:", error);
    }
  }, [enabled, finalStorageKey]);
  
  /**
   * Check if there is saved content available
   */
  const hasSavedContent = useCallback(() => {
    if (!enabled || !finalStorageKey) return false;
    
    try {
      const content = localStorage.getItem(finalStorageKey);
      return content !== null && content !== undefined && content !== "null";
    } catch {
      return false;
    }
  }, [enabled, finalStorageKey]);
  
  return {
    saveContent,
    getSavedContent,
    clearSavedContent,
    hasSavedContent,
    isEnabled: enabled && !!finalStorageKey,
  };
}