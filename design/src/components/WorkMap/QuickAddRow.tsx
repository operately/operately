import React, { useState } from "react";
import { HoverQuickEntryWidget } from "./HoverQuickEntryWidget.tsx";

interface QuickAddRowProps {
  /**
   * Number of columns in the table, used for the colspan attribute
   */
  columnCount: number;
  
  /**
   * Filter type to determine what kind of item to add (projects, goals, etc.)
   */
  filter?: string;
}

/**
 * A component that renders a row with an "Add new item" button at the bottom of a WorkMap table
 * When clicked, it shows the HoverQuickEntryWidget for adding new items
 */
export function QuickAddRow({ columnCount, filter }: QuickAddRowProps): React.ReactElement {
  const [isAddingItem, setIsAddingItem] = useState<boolean>(false);

  const handleAddClick = (): void => {
    setIsAddingItem(true);
  };

  const handleClose = (): void => {
    setIsAddingItem(false);
  };

  // Determine button text based on filter
  let buttonText = "Add new item";
  if (filter === "projects") {
    buttonText = "Add new project";
  } else if (filter === "goals") {
    buttonText = "Add new goal";
  }

  return (
    <tr className="border-t border-surface-outline">
      <td colSpan={columnCount} className="py-2 px-2 sm:px-4">
        {!isAddingItem ? (
          <button
            onClick={handleAddClick}
            className="flex items-center gap-1 text-sm text-content-dimmed hover:text-content-base transition-colors py-1.5 px-2 rounded-md hover:bg-surface-highlight"
            aria-label={buttonText}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14m-7-7h14" />
            </svg>
            <span>{buttonText}</span>
          </button>
        ) : (
          <div className="flex justify-start w-full">
            <div className="w-full sm:w-auto max-w-full sm:max-w-[460px] bg-surface-base dark:bg-surface-dimmed border border-surface-outline rounded-md px-2 py-2">
              <HoverQuickEntryWidget
                parentItem={null} // No parent item for root level
                onClose={handleClose}
                filter={filter}
              />
            </div>
          </div>
        )}
      </td>
    </tr>
  );
}
