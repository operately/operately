import React, { useState, useRef, useEffect } from "react";
import type { WorkMapItem, GoalStatus } from "../../types/workmap";

interface HoverQuickEntryWidgetProps {
  /**
   * The parent item under which the new item will be created
   * If null, item will be created at the root level
   */
  parentItem: WorkMapItem | null;
  
  /**
   * Current filter to determine what type of item can be created
   * (e.g., "goals", "projects", "all")
   */
  filter?: string;
  
  /**
   * Callback function when the widget is closed
   */
  onClose?: () => void;
}

/**
 * Widget for quickly adding new goals or projects to the WorkMap
 */
export function HoverQuickEntryWidget({
  parentItem,
  filter,
  onClose = () => {},
}: HoverQuickEntryWidgetProps): React.ReactElement {
  const [inputValue, setInputValue] = useState<string>("");
  
  // Set default item type based on the filter
  let defaultType: "goal" | "project" = "goal"; // Default to goal for most views
  if (filter === "projects") {
    defaultType = "project";
  }
  
  const [itemType, setItemType] = useState<"goal" | "project">(defaultType);
  const inputRef = useRef<HTMLInputElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Focus the input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Handle the form submission
  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (inputValue.trim()) {
      // Generate a unique ID for the new item
      const newItemId = Math.random().toString(36).substring(2, 9);

      // Create the new item object with all necessary fields for display
      const newItem: WorkMapItem = {
        id: newItemId,
        type: itemType,
        name: inputValue.trim(),
        status: "pending" as GoalStatus, // Initial status is pending
        progress: 0,
        space: "", // Empty space
        owner: {
          // Empty owner
          name: "",
          initials: "",
        },
        children: [],
        deadline: { 
          display: "",
          isPast: false 
        },
        nextStep: "", // Empty next step
      };

      // Dispatch a custom event for the WorkMapTable to handle
      const event = new CustomEvent("workmap:add-item", {
        detail: {
          parentItem: parentItem, // The parent item
          newItem: newItem, // The new item to add
        },
      });
      document.dispatchEvent(event);

      // Close the widget after submission
      onClose();
    }
  };

  // Handle clicks outside to close the input field
  // For parent item popups, we'll rely only on the explicit cancel button
  // For the bottom quick add row, we'll use the standard click-outside behavior
  useEffect(() => {
    // Skip click outside handling for parent item popups ("+ Add" button)
    // This prevents the popup from closing when clicking inside it
    if (parentItem) {
      return; // Do nothing for parent item popups
    }

    // Only apply click-outside for the bottom quick add row
    const handleClickOutside = (event: MouseEvent): void => {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose, parentItem]);

  // Handle escape key to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div 
      ref={widgetRef} 
      className="w-full sm:inline-block"
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
    >
      <form 
        onSubmit={handleSubmit} 
        className="w-full sm:w-auto"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 w-full max-w-full">
          {/* First row for mobile (type + input) */}
          <div className="flex flex-1 w-full">
            {/* Type selection or label - only show dropdown if no specific filter is set */}
            <div className="relative border border-r-0 border-surface-outline rounded-l-md">
              {filter === "projects" || filter === "goals" ? (
                // Display fixed item type based on filter
                <div className="h-8 bg-surface-base dark:bg-surface-dimmed text-content-base pl-2 pr-3 py-1.5 text-sm flex items-center">
                  {filter === "projects" ? "Project" : "Goal"}
                </div>
              ) : (
                // Show dropdown when no specific filter is set
                <>
                  <select
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value as "goal" | "project")}
                    className="appearance-none h-8 bg-surface-base dark:bg-surface-dimmed text-content-base pl-2 pr-7 py-1 focus:outline-none text-sm"
                  >
                    <option value="goal">Goal</option>
                    <option value="project">Project</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-content-dimmed">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </>
              )}
            </div>

            {/* Input field */}
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`New ${itemType} ${
                parentItem ? `in ${parentItem.name}` : "company-wide"
              }...`}
              className="h-9 pl-2 pr-3 py-1 bg-surface-base dark:bg-surface-dimmed text-content-base focus:outline-none w-full text-sm border-y border-r sm:border-y sm:border-r-0 border-surface-outline rounded-r-md sm:rounded-none sm:min-w-[360px]"
            />
          </div>

          {/* Buttons - in separate rows on mobile, side by side on desktop */}
          <div className="flex flex-col sm:flex-row sm:flex-none gap-2 sm:gap-0 w-full sm:w-auto">
            {/* Add button */}
            <button
              type="submit"
              className="h-9 px-3 text-sm bg-accent-1 hover:bg-accent-1-light text-white-1 transition-colors rounded-md sm:rounded-none sm:rounded-l-none w-full sm:w-auto"
              disabled={!inputValue.trim()}
            >
              Add
            </button>

            {/* Cancel button */}
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-3 text-sm bg-surface-base dark:bg-surface-dimmed border border-surface-outline text-content-base rounded-md sm:rounded-none sm:rounded-r-md hover:bg-surface-dimmed dark:hover:bg-surface-highlight transition-colors sm:border-l-0 w-full sm:w-auto"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
