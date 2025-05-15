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
  task: Types.Task;
  onStatusChange?: (newStatus: Types.Status) => void;
  showFullBadge?: boolean;
}

export function StatusSelector({
  task,
  onStatusChange,
  showFullBadge = false,
}: StatusSelectorProps) {
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
        const status = firstOption[0];
        onStatusChange && onStatusChange(status as Types.Status);
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

  return (
    <Menu
      customTrigger={
        <div className="cursor-pointer inline-flex items-center">
          {showFullBadge ? (
            <StatusBadge
              status={taskStatusConfig[task.status].status}
              customLabel={taskStatusConfig[task.status].label}
            />
          ) : (
            <div className="inline-flex items-center justify-center w-4 h-4">
              {React.createElement(taskStatusConfig[task.status].icon, {
                size: 16,
                className: `align-middle ${taskStatusConfig[task.status].color || ""}`,
              })}
            </div>
          )}
        </div>
      }
      size="small"
      headerContent={searchInput}
      onOpenChange={handleMenuOpenChange}
    >
      {filteredStatusOptions.map(([status, config]) => {
        const isCurrentStatus = status === task.status;
        return (
          <MenuActionItem
            key={status}
            icon={config.icon}
            onClick={() => onStatusChange && onStatusChange(status as Types.Status)}
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
