import React from "react";
import * as Popover from "@radix-ui/react-popover";
import classNames from "../../utils/classnames";
import { IconCircleDashed, IconCircleDot, IconCircleCheckFilled, IconX, IconChevronDown, IconCheck } from "../../icons";

// Custom CircleCheck SVG component based on Linear's design
// 
// Why custom instead of Tabler's IconCircleCheckFilled:
// - Tabler icons have built-in whitespace within their 24x24 viewBox and use stroke-based design
// - This makes the checkmark inside IconCircleCheckFilled very small and hard to see
// - Custom SVGs that use fill-based design and full viewBox utilization appear more prominent
// - This implementation uses a 24x24 viewBox (matching Tabler) but with optimized sizing:
//   * Circle spans from 2-22 (radius 10) leaving minimal padding
//   * Checkmark is carefully positioned and sized for visibility
//   * Uses currentColor to inherit design system colors (text-success)
const CustomCircleCheck = ({ size = 14, className = "" }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={`${className} flex-shrink-0`}
    role="img"
    focusable="false"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: size, height: size }}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM17.3 9.8C17.69 9.41 17.69 8.78 17.3 8.39C16.91 8 16.28 8 15.89 8.39L10.5 13.78L8.11 11.39C7.72 11 7.09 11 6.7 11.39C6.31 11.78 6.31 12.41 6.7 12.8L9.8 15.9C10.19 16.29 10.82 16.29 11.21 15.9L17.3 9.8Z"
      fill="currentColor"
    />
  </svg>
);

// Import types from the shared types module
import * as Types from "../types";

// Create colored icon components for each status
const ColoredIconCircleDot = (props: any) => <IconCircleDot {...props} className="text-brand-1" />;
const ColoredIconCircleCheckFilled = (props: any) => <CustomCircleCheck {...props} className="text-success" />;
const ColoredIconCheck = (props: any) => <IconCheck {...props} className="text-success" />;
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

  // Use IconCheck for 'done' in button mode, otherwise use config.icon
  const iconToRender = status === "done" ? ColoredIconCheck : config.icon;

  return (
    <div className={buttonClassName}>
      {React.createElement(iconToRender, {
        size: iconSize,
        className: "flex-shrink-0 flex items-center self-center",
      })}
      <span className="flex items-center leading-none">{config.label}</span>
      {!readonly && (
        <IconChevronDown size={iconSize - 2} className="flex-shrink-0 opacity-60 flex items-center self-center" />
      )}
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
        setSelectedIndex((prev) => (prev < filteredStatusOptions.length - 1 ? prev + 1 : prev));
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
      <div className={`inline-flex items-center justify-center h-6 ${containerSize}`}>
        {React.createElement(taskStatusConfig[status].icon, {
          size: iconSize,
          className: `flex items-center self-center ${taskStatusConfig[status].color || ""}`,
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
          <div className={`inline-flex items-center justify-center h-6 ${containerSize}`}>
            {React.createElement(taskStatusConfig[status].icon, {
              size: iconSize,
              className: `flex items-center self-center ${taskStatusConfig[status].color || ""}`,
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
                    className={classNames("flex items-center gap-2 px-1.5 py-1 rounded cursor-pointer", {
                      "bg-surface-dimmed": isSelected,
                      "hover:bg-surface-dimmed": !isSelected,
                    })}
                    onClick={() => handleItemClick(statusOption as Types.Status)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {React.createElement(config.icon, { size: 18 })}
                      <div className="text-sm truncate">{config.label}</div>
                    </div>
                    {isCurrentStatus && <IconCircleCheckFilled size={14} className="text-primary-500 ml-2" />}
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
