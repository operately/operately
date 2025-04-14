import { useState, useRef } from "react";
import { useTableRowContext } from "./context";
import { ItemType } from "../types";

export function QuickEntryWidget() {
  const { showQuickEntryWidget } = useTableRowContext();
  
  if (!showQuickEntryWidget) return null;
  
  return (
    <tr className="bg-transparent">
      <td colSpan={7} className="p-0">
        <div className="relative">
          <ResponsiveWrapper />
        </div>
      </td>
    </tr>
  );
}

export function ResponsiveWrapper() {
  const { level, setShowQuickEntryWidget } = useTableRowContext();
  const indentPadding = level * 20;
  
  const handleClose = () => {
    setShowQuickEntryWidget(false);
  };

  return (
    <>
      {/* Mobile view - full width with proper padding */}
      <div className="block sm:hidden w-full px-2 pt-1 pb-2">
        <div className="bg-surface-base dark:bg-surface-dimmed shadow-lg border border-surface-outline rounded-md w-full">
          <QuickEntryForm onClose={handleClose} />
        </div>
      </div>

      {/* Desktop view - positioned with indent */}
      <div
        className="hidden sm:block absolute z-10 mt-1"
        style={{ marginLeft: `${indentPadding + 40}px` }}
      >
        <div className="bg-surface-base dark:bg-surface-dimmed shadow-lg border border-surface-outline rounded-md w-auto min-w-[500px]">
          <QuickEntryForm onClose={handleClose} />
        </div>
      </div>
    </>
  );
}

interface FormProps {
  onClose: () => void;
}

function QuickEntryForm({ onClose }: FormProps) {
  const { item } = useTableRowContext();
  const [itemType, setItemType] = useState<ItemType>("goal");
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      // Here you would handle the actual submission
      console.log(`Creating new ${itemType}: ${inputValue} in ${item.name}`);
      onClose();
    }
  };

  return (
    <div 
      className="w-full sm:inline-block"
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
    >
      <form 
        onSubmit={handleSubmit} 
        className="w-full sm:w-auto"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 w-full max-w-full">
          {/* Type selection dropdown */}
          <div className="flex flex-1 w-full">
            <div className="relative border border-r-0 border-surface-outline rounded-l-md">
              <select
                value={itemType}
                onChange={(e) => setItemType(e.target.value as "goal" | "project")}
                className="appearance-none h-9 bg-surface-base dark:bg-surface-dimmed text-content-base pl-2 pr-7 py-1 focus:outline-none text-sm"
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
            </div>

            {/* Input field */}
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`New ${itemType} in ${item.name}...`}
              className="h-9 pl-2 pr-3 py-1 bg-surface-base dark:bg-surface-dimmed text-content-base focus:outline-none w-full text-sm border-y border-r sm:border-y sm:border-r-0 border-surface-outline rounded-r-md sm:rounded-none sm:min-w-[360px]"
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row sm:flex-none gap-2 sm:gap-0 w-full sm:w-auto">
            {/* Add button */}
            <button
              type="submit"
              className="h-9 px-3 text-sm bg-blue-500 hover:bg-blue-600 text-white transition-colors rounded-md sm:rounded-none sm:rounded-l-none w-full sm:w-auto"
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
