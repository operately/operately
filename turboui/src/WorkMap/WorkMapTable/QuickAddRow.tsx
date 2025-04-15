import { useState } from "react";
import { IconPlus } from "@tabler/icons-react";
import { QuickEntryWidget } from "../QuickEntryWidget";
import { NewItem } from "../types";

interface Props {
  filter?: string;
  addItem: (newItem: NewItem) => void;
}

/**
 * A component that renders a row with an "Add new item" button at the bottom of a WorkMap table
 * When clicked, it shows the QuickEntryWidget for adding new items
 */
export function QuickAddRow({ filter, addItem }: Props) {
  const [isAddingItem, setIsAddingItem] = useState(false);

  // Determine button text based on filter
  let buttonText = "Add new item";
  if (filter === "projects") buttonText = "Add new project";
  else if (filter === "goals") buttonText = "Add new goal";

  return (
    <tr className="border-t border-surface-outline">
      <td className="py-2 px-2 sm:px-4">
        {!isAddingItem ? (
          <button
            onClick={() => setIsAddingItem(true)}
            className="flex items-center gap-1 text-sm text-content-dimmed hover:text-content-base transition-colors py-1.5 px-2 rounded-md hover:bg-surface-highlight"
            aria-label={buttonText}
            type="button"
          >
            <IconPlus size={18} />
            <span>{buttonText}</span>
          </button>
        ) : (
          <div className="flex justify-start w-full">
            <div className="w-full sm:w-auto max-w-full sm:max-w-[460px] bg-surface-base dark:bg-surface-dimmed border border-surface-outline rounded-md px-2 py-2">
              <QuickEntryWidget
                addItem={addItem}
                indentPadding={0}
                showWidget={isAddingItem}
                setShowWidget={setIsAddingItem}
              />
            </div>
          </div>
        )}
      </td>
    </tr>
  );
}
