import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { IconChevronDown } from "../../icons";

export namespace Dropdown {
  export interface Item {
    id: string;
    name: string;
  }

  export interface Props<T extends Item> {
    items: T[];
    value: string;
    onSelect: (item: T) => void;
    placeholder?: string;
    testId?: string;
    error?: string;
  }
}

export function Dropdown<T extends Dropdown.Item>({
  items,
  value,
  onSelect,
  placeholder = "Select an option",
  testId,
  error,
}: Dropdown.Props<T>) {
  const [isOpen, setIsOpen] = React.useState(false);
  const selectedItem = items.find((item) => item.id === value);
  const selectedLabel = selectedItem?.name || placeholder;

  return (
    <div>
      <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className={`w-full text-left border rounded px-2 py-1.5 text-sm bg-surface-base text-content-base focus:outline-none focus:ring-0 hover:bg-surface-dimmed flex items-center justify-between ${
              error ? "border-content-error" : "border-surface-outline"
            }`}
            data-test-id={testId}
          >
            <span>{selectedLabel}</span>
            <IconChevronDown size={16} className="text-content-subtle" />
          </button>
        </Popover.Trigger>

        <Popover.Content
          className="z-50 bg-surface-base border border-surface-outline rounded shadow-lg p-1 w-[var(--radix-popover-trigger-width)]"
          side="bottom"
          align="start"
          sideOffset={4}
        >
          <div className="overflow-y-auto max-h-48">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`w-full text-left px-3 py-2 text-sm cursor-pointer ${
                  item.id === value ? "bg-surface-dimmed font-medium" : "hover:bg-surface-dimmed"
                }`}
                onClick={() => {
                  onSelect(item);
                  setIsOpen(false);
                }}
              >
                {item.name}
              </button>
            ))}
          </div>
        </Popover.Content>
      </Popover.Root>
      {error && <div className="text-xs text-content-error mt-1">{error}</div>}
    </div>
  );
}
