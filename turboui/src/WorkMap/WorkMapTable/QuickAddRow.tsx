import { IconPlus } from "@tabler/icons-react";
import { QuickEntryWidget } from "../QuickEntryWidget";
import { NewItem, WorkMapFilter } from "../types";
import { useQuickEntryWidgetState } from "../hooks/useQuickEntryWidgetState";
import classNames from "../../utils/classnames";
import { match } from "ts-pattern";

interface Props {
  filter: WorkMapFilter;
  addItem: (newItem: NewItem) => void;
}

/**
 * A component that renders a row with an "Add new item" button at the bottom of a WorkMap table
 * When clicked, it shows the QuickEntryWidget for adding new items
 */
export function QuickAddRow({ filter, addItem }: Props) {
  // Use our shared hook to manage widget state and visibility
  const {
    isWidgetOpen: isAddingItem,
    setWidgetOpen: setIsAddingItem,
    anyWidgetOpen,
  } = useQuickEntryWidgetState(false);

  const buttonText = match(filter)
    .with("goals", () => "Add new goal")
    .with("projects", () => "Add new project")
    .otherwise(() => "Add new item");

  const buttonClass = classNames(
    "flex items-center gap-1 text-sm text-content-dimmed hover:text-content-base transition-all py-1.5 px-2 rounded-md hover:bg-surface-highlight",
    {
      "opacity-0 pointer-events-none": anyWidgetOpen && !isAddingItem,
    }
  );

  if (filter === "completed") return null;

  return (
    <tr className="border-t border-surface-outline">
      <td className="py-2 px-2 sm:px-4">
        {!isAddingItem ? (
          <button
            onClick={() => setIsAddingItem(true)}
            className={buttonClass}
            aria-label={buttonText}
            type="button"
            disabled={anyWidgetOpen && !isAddingItem}
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
                filter={filter}
              />
            </div>
          </div>
        )}
      </td>
    </tr>
  );
}
