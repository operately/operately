import React from "react";
import { StatusBadge } from "../../StatusBadge";
import { Menu, MenuActionItem } from "../../Menu";
import {
  IconCircleDashed,
  IconCircleDot,
  IconCircleCheckFilled,
  IconX,
  IconCheck
} from "@tabler/icons-react";

// Import types from the shared types module
import * as Types from "../types";

// Create colored icon components for each status
const ColoredIconCircleDot = (props: any) => <IconCircleDot {...props} className="text-brand-1" />;
const ColoredIconCircleCheckFilled = (props: any) => (
  <IconCircleCheckFilled {...props} className="text-callout-success-icon" />
);

// Map task status to badge status, labels and icons
const taskStatusConfig: Record<Types.Status, { status: string; label: string; icon: any; color?: string }> = {
  pending: { status: "not_started", label: "Not started", icon: IconCircleDashed },
  in_progress: { status: "in_progress", label: "In progress", icon: ColoredIconCircleDot, color: "text-brand-1" },
  done: { status: "completed", label: "Done", icon: ColoredIconCircleCheckFilled, color: "text-callout-success-icon" },
  canceled: { status: "canceled", label: "Canceled", icon: IconX },
};

interface StatusSelectorProps {
  status: Types.Status;
  onChange: (newStatus: Types.Status) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  readonly?: boolean;
  showFullBadge?: boolean;
}

export function StatusSelector({
  status,
  onChange,
  size = 'md',
  readonly = false,
  showFullBadge = false,
}: StatusSelectorProps) {
  // Define size-based dimensions
  const sizeConfig = {
    sm: { iconSize: 14, containerSize: 'w-3.5 h-3.5' },
    md: { iconSize: 16, containerSize: 'w-4 h-4' },
    lg: { iconSize: 20, containerSize: 'w-5 h-5' },
    xl: { iconSize: 24, containerSize: 'w-6 h-6' },
    '2xl': { iconSize: 28, containerSize: 'w-7 h-7' },
  };
  
  const { iconSize, containerSize } = sizeConfig[size];
  const [searchTerm, setSearchTerm] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Filter status options based on search term
  const filteredStatusOptions = Object.entries(taskStatusConfig).filter(([_, config]) =>
    config.label.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Handle menu open/close events
  const handleMenuOpenChange = (open: boolean) => {
    if (open) {
      // Focus input when menu opens
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
    } else {
      // Reset search term when menu closes
      setSearchTerm("");
    }
  };

  // Handle enter key in search input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && filteredStatusOptions.length > 0) {
      const firstOption = filteredStatusOptions[0];

      if (firstOption) {
        const newStatus = firstOption[0];
        onChange(newStatus as Types.Status);
      }
    }
  };

  // Custom search input for the menu header
  const searchInput = (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        placeholder="Change status..."
        className="w-full bg-surface-base text-content-base text-sm py-1 px-2 border border-surface-outline rounded-md focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={(e) => {
          // Prevent menu from closing when typing
          e.stopPropagation();
          handleKeyDown(e);
        }}
        onClick={(e) => e.stopPropagation()} // Prevent menu from closing when clicking in the input
      />
      <span className="absolute right-2 top-1.5 text-content-subtle">
        <div className="text-[10px] font-mono">⏎</div>
      </span>
    </div>
  );

  // Readonly mode - just show the status without interaction
  if (readonly) {
    return (
      <div className="inline-flex items-center">
        {showFullBadge ? (
          <StatusBadge
            status={taskStatusConfig[status].status}
            customLabel={taskStatusConfig[status].label}
          />
        ) : (
          <div className={`inline-flex items-center justify-center ${containerSize}`}>
            {React.createElement(taskStatusConfig[status].icon, {
              size: iconSize,
              className: `align-middle ${taskStatusConfig[status].color || ""}`,
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <Menu
      customTrigger={
        <div className="cursor-pointer inline-flex items-center">
          {showFullBadge ? (
            <StatusBadge
              status={taskStatusConfig[status].status}
              customLabel={taskStatusConfig[status].label}
            />
          ) : (
            <div className={`inline-flex items-center justify-center ${containerSize}`}>
              {React.createElement(taskStatusConfig[status].icon, {
                size: iconSize,
                className: `align-middle ${taskStatusConfig[status].color || ""}`,
              })}
            </div>
          )}
        </div>
      }
      size="small"
      headerContent={searchInput}
      onOpenChange={handleMenuOpenChange}
    >
      {filteredStatusOptions.map(([statusOption, config]) => {
        const isCurrentStatus = statusOption === status;
        return (
          <MenuActionItem
            key={statusOption}
            icon={config.icon}
            onClick={() => onChange(statusOption as Types.Status)}
          >
            <div className="flex items-center justify-between w-full">
              {config.label}
              {isCurrentStatus && <IconCheck size={14} className="text-primary-500 ml-2" />}
            </div>
          </MenuActionItem>
        );
      })}
    </Menu>
  );
}
