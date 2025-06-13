import React from "react";
import * as Popover from "@radix-ui/react-popover";
import classNames from "../../utils/classnames";
import { IconCircleDashed, IconCircleDot, IconCircleCheck, IconX, IconChevronDown } from "@tabler/icons-react";

// Import types from the shared types module
import * as Types from "../types";

// Create colored icon components for each status
const ColoredIconCircleDot = (props: any) => <IconCircleDot {...props} className="text-brand-1" />;
const ColoredIconCircleCheckFilled = (props: any) => <IconCircleCheck {...props} className="text-success" />;
const ColoredIconX = (props: any) => <IconX {...props} className="text-red-500" />;

// Map task status to labels and icons
const taskStatusConfig: Record<Types.Status, { label: string; icon: any; color?: string; buttonColor?: string }> = {
  pending: { label: "Not started", icon: IconCircleDashed, buttonColor: "text-content-dimmed" },
  in_progress: {
    label: "In progress",
    icon: ColoredIconCircleDot,
    color: "text-brand-1",
    buttonColor: "text-brand-1",
  },
  done: {
    label: "Done",
    icon: ColoredIconCircleCheckFilled,
    color: "text-success",
    buttonColor: "text-success",
  },
  canceled: { label: "Canceled", icon: ColoredIconX, color: "text-red-500", buttonColor: "text-red-500" },
};

interface StatusSelectorProps {
  status: Types.Status;
  onChange: (newStatus: Types.Status) => void;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  readonly?: boolean;
  showFullBadge?: boolean;
}

// Helper function to create a button-styled status selector
function StatusButton({
  status,
  size = "md",
  readonly = false,
}: {
  status: Types.Status;
  size?: StatusSelectorProps["size"];
  readonly?: boolean;
}) {
  const config = taskStatusConfig[status];

  // Button size configuration
  const buttonSizeConfig = {
    sm: { textSize: "text-xs", padding: "px-2 py-1", iconSize: 12 },
    md: { textSize: "text-sm", padding: "px-2.5 py-1.5", iconSize: 14 },
    lg: { textSize: "text-sm", padding: "px-3 py-1.5", iconSize: 16 },
    xl: { textSize: "text-base", padding: "px-3.5 py-2", iconSize: 18 },
    "2xl": { textSize: "text-lg", padding: "px-4 py-2.5", iconSize: 20 },
  };

  const { textSize, padding, iconSize } = buttonSizeConfig[size];

  const buttonClassName = classNames(
    "inline-flex items-center gap-1.5 rounded-full border font-medium transition-all duration-100 whitespace-nowrap",
    textSize,
    padding,
    // Special styling for "done" and "canceled" status to make them more prominent
    status === "done"
      ? readonly
        ? "border-green-200 bg-green-50 cursor-default"
        : "border-green-200 bg-green-50 hover:bg-green-100 cursor-pointer"
      : status === "canceled"
      ? readonly
        ? "border-red-200 bg-red-50 cursor-default"
        : "border-red-200 bg-red-50 hover:bg-red-100 cursor-pointer"
      : readonly
      ? "border-surface-outline bg-surface-base cursor-default"
      : "border-surface-outline bg-surface-base hover:bg-surface-accent cursor-pointer",
    config.buttonColor,
  );

  return (
    <div className={buttonClassName}>
      {React.createElement(config.icon, {
        size: iconSize,
        className: "flex-shrink-0",
      })}
      <span>{config.label}</span>
      {!readonly && <IconChevronDown size={iconSize - 2} className="flex-shrink-0 opacity-60" />}
    </div>
  );
}

export function StatusSelector({
  status,
  onChange,
  size = "md",
  readonly = false,
  showFullBadge = false,
}: StatusSelectorProps) {
  const sizeConfig = {
    sm: { iconSize: 14, containerSize: "w-3.5 h-3.5" },
    md: { iconSize: 16, containerSize: "w-4 h-4" },
    lg: { iconSize: 20, containerSize: "w-5 h-5" },
    xl: { iconSize: 24, containerSize: "w-6 h-6" },
    "2xl": { iconSize: 28, containerSize: "w-7 h-7" },
  };

  const { iconSize, containerSize } = sizeConfig[size];
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const itemRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  const filteredStatusOptions = Object.entries(taskStatusConfig).filter(([_, config]) =>
    config.label.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Reset selected index when search results change (but not on every render)
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [filteredStatusOptions.length]);

  // Scroll selected item into view
  React.useEffect(() => {
    const selectedItem = itemRefs.current[selectedIndex];
    if (selectedItem) {
      selectedItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIndex]);

  // Handle popover open/close
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchTerm("");
      setSelectedIndex(0);
    }
  };

  // Handle keyboard navigation - copied from PersonField
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < filteredStatusOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        const selectedOption = filteredStatusOptions[selectedIndex];
        if (selectedOption) {
          onChange(selectedOption[0] as Types.Status);
          setIsOpen(false);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  const handleItemClick = (newStatus: Types.Status) => {
    onChange(newStatus);
    setIsOpen(false);
  };

  if (readonly) {
    return showFullBadge ? (
      <StatusButton status={status} size={size} readonly={true} />
    ) : (
      <div className={`inline-flex items-center justify-center ${containerSize}`}>
        {React.createElement(taskStatusConfig[status].icon, {
          size: iconSize,
          className: `align-middle ${taskStatusConfig[status].color || ""}`,
        })}
      </div>
    );
  }

  return (
    <Popover.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Popover.Trigger className="cursor-pointer">
        {showFullBadge ? (
          <StatusButton status={status} size={size} readonly={false} />
        ) : (
          <div className={`inline-flex items-center justify-center ${containerSize}`}>
            {React.createElement(taskStatusConfig[status].icon, {
              size: iconSize,
              className: `align-middle ${taskStatusConfig[status].color || ""}`,
            })}
          </div>
        )}
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="bg-surface-base shadow rounded border border-stroke-base p-0.5"
          style={{ width: 220 }}
          sideOffset={4}
          alignOffset={2}
          align="start"
        >
          <div className="p-1">
            <div className="p-1 pb-0.5">
              <input
                ref={inputRef}
                className="w-full border border-stroke-base rounded px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="Change status..."
                value={searchTerm}
                autoFocus
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            <div className="overflow-y-auto pt-0.5 pb-0.5" style={{ maxHeight: 210 }}>
              {filteredStatusOptions.map(([statusOption, config], index) => {
                const isCurrentStatus = statusOption === status;
                const isSelected = index === selectedIndex;
                return (
                  <div
                    key={statusOption}
                    ref={(el) => (itemRefs.current[index] = el)}
                    className={classNames(
                      "flex items-center gap-2 px-1.5 py-1 rounded cursor-pointer",
                      {
                        "bg-surface-dimmed": isSelected,
                        "hover:bg-surface-dimmed": !isSelected,
                      }
                    )}
                    onClick={() => handleItemClick(statusOption as Types.Status)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {React.createElement(config.icon, { size: 18 })}
                      <div className="text-sm truncate">{config.label}</div>
                    </div>
                    {isCurrentStatus && <IconCircleCheck size={14} className="text-primary-500 ml-2" />}
                  </div>
                );
              })}
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
