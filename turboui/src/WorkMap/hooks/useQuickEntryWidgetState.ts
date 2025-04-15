import { useState, useEffect } from "react";

// Global state and event management
type WidgetStateListener = (isOpen: boolean) => void;
const listeners: WidgetStateListener[] = [];
let isAnyWidgetCurrentlyOpen = false;

/**
 * Broadcast widget state changes to all components using this hook
 */
function broadcastWidgetState(isOpen: boolean) {
  isAnyWidgetCurrentlyOpen = isOpen;
  listeners.forEach(listener => listener(isOpen));
}

/**
 * Custom hook to manage QuickEntryWidget visibility across the WorkMap
 * Ensures only one widget can be open at a time using an event-based approach
 */
export function useQuickEntryWidgetState(initialState: boolean = false) {
  const [isWidgetOpen, setIsWidgetOpen] = useState(initialState);
  const [anyWidgetOpen, setAnyWidgetOpen] = useState(isAnyWidgetCurrentlyOpen);

  // Register for notifications about widget state changes
  useEffect(() => {
    // When this widget opens, notify others
    if (isWidgetOpen) {
      broadcastWidgetState(true);
    }

    // Add listener to receive notifications from other instances
    const listener = (isOpen: boolean) => {
      setAnyWidgetOpen(isOpen);
    };
    
    listeners.push(listener);
    
    return () => {
      // Cleanup: remove listener and reset global state if needed
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
      
      // If this was the widget that was open, close it globally
      if (isWidgetOpen) {
        broadcastWidgetState(false);
      }
    };
  }, [isWidgetOpen]);

  /**
   * Custom setter that manages global widget state
   */
  const setWidgetOpen = (show: boolean) => {
    // If trying to open widget when another is already open, don't allow it
    if (show && anyWidgetOpen && !isWidgetOpen) {
      return;
    }
    
    setIsWidgetOpen(show);
    
    // If closing our widget and we were the open one, notify others
    if (!show && isWidgetOpen) {
      broadcastWidgetState(false);
    }
  };

  return {
    isWidgetOpen,         // Is this specific widget open
    setWidgetOpen,        // Set this widget's visibility
    anyWidgetOpen,        // Is any widget open anywhere
  };
}
