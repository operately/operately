import { useState } from "react";
import { IconChevronDown } from "@tabler/icons-react";
import { ItemType, NewItem, WorkMapFilter, WorkMapItem } from "./types";
import { useEffect } from "react";
import classNames from "../utils/classnames";

interface Props {
  showWidget: boolean;
  setShowWidget: (show: boolean) => void;
  item?: WorkMapItem;
  indentPadding: number;
  addItem: (newItem: NewItem) => void;
  filter: WorkMapFilter;
}

export function QuickEntryWidget({ showWidget, ...props }: Props) {
  if (!showWidget) return null;

  return (
    <tr className="bg-transparent">
      <td colSpan={7} className="p-0">
        <div className="relative">
          <ResponsiveWrapper {...props} />
        </div>
      </td>
    </tr>
  );
}

interface WrapperProps {
  indentPadding: number;
  setShowWidget: (show: boolean) => void;
  item?: WorkMapItem;
  addItem: (newItem: NewItem) => void;
  filter: WorkMapFilter;
}

export function ResponsiveWrapper({ indentPadding, ...props }: WrapperProps) {
  return (
    <>
      {/* Mobile view - full width with proper padding */}
      <div className="block sm:hidden w-full px-2 pt-1 pb-2">
        <div className="bg-surface-base dark:bg-surface-dimmed shadow-lg border border-surface-outline rounded-md w-full">
          <QuickEntryForm {...props} />
        </div>
      </div>

      {/* Desktop view - positioned with indent */}
      <div
        className="hidden sm:block absolute z-10 mt-1"
        style={{ marginLeft: `${indentPadding + 40}px` }}
      >
        <div className="bg-surface-base dark:bg-surface-dimmed shadow-lg border border-surface-outline rounded-md w-auto min-w-[500px]">
          <QuickEntryForm {...props} />
        </div>
      </div>
    </>
  );
}

interface FormProps {
  setShowWidget: (show: boolean) => void;
  item?: WorkMapItem;
  addItem: (newItem: NewItem) => void;
  filter: WorkMapFilter;
}

function QuickEntryForm({ setShowWidget, addItem, item, filter }: FormProps) {
  const [itemType, setItemType] = useState<ItemType>("goal");
  const [inputValue, setInputValue] = useState("");

  const placeholder = item
    ? `New ${itemType} in ${item.name}...`
    : `New ${itemType}...`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      await addItem({
        name: inputValue.trim(),
        type: itemType,
        parentId: null,
      });
      setShowWidget(false);
    }
  };

  const handleCancel = () => {
    setShowWidget(false);
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
            <TypeSelector
              itemType={itemType}
              setItemType={setItemType}
              filter={filter}
            />

            {/* Input field */}
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={placeholder}
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
              onClick={handleCancel}
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

interface TypeSelectorProps {
  filter: WorkMapFilter;
  itemType: ItemType;
  setItemType: (type: ItemType) => void;
}

/**
 * TypeSelector renders the type selection UI for adding a new item.
 * - If filter is 'projects' or 'goals', shows a static label (no dropdown).
 * - Otherwise, shows a dropdown to select between Goal and Project.
 * - Updates itemType to Project or Goal automatically when the filter changes.
 */
function TypeSelector({ itemType, setItemType, filter }: TypeSelectorProps) {
  // Compute select or label class based on filter
  const className = classNames(
    "appearance-none text-content-base focus:outline-none text-sm",
    {
      "pl-2 py-1.5": filter === "all",
      "px-2 py-1.5 border border-r-0 border-surface-outline rounded-l-md":
        filter !== "all",
    }
  );

  // When filter changes, force itemType to match if needed
  useEffect(() => {
    if (filter === "projects") {
      setItemType("project");
    }
    if (filter === "goals") {
      setItemType("goal");
    }
  }, [setItemType, filter]);

  if (filter === "projects") {
    return <div className={className}>Project</div>;
  }

  if (filter === "goals") {
    return <div className={className}>Goal</div>;
  }

  return (
    <div className="flex items-center border border-r-0 border-surface-outline rounded-l-md">
      <select
        value={itemType}
        onChange={(e) => setItemType(e.target.value as ItemType)}
        className={className}
      >
        <option value="goal">Goal</option>
        <option value="project">Project</option>
      </select>
      <IconChevronDown size={16} className="text-content-dimmed" />
    </div>
  );
}
