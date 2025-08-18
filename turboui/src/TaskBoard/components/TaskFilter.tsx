import React, { useState, useRef, useEffect, useMemo } from "react";
import * as Popover from "@radix-ui/react-popover";
import {
  IconFilter,
  IconChevronDown,
  IconChevronRight,
  IconSearch,
  IconCircle,
  IconCircleDashed,
  IconCircleDot,
  IconUser,
  IconCalendar,
  IconMessage,
  IconFlag,
  IconX,
  IconCircleCheckCustom,
  IconCircleXCustom,
} from "../../icons";
import classNames from "../../utils/classnames";
import * as Types from "../types";
import { AvatarWithName } from "../../Avatar";
import { PrimaryButton, SecondaryButton } from "../../Button";

// Status configuration matching StatusSelector
const taskStatusConfig: Record<Types.Status, { label: string; icon: React.ReactNode; color?: string }> = {
  pending: { label: "Not started", icon: <IconCircleDashed size={14} />, color: "text-content-dimmed" },
  todo: { label: "Not started", icon: <IconCircleDashed size={14} />, color: "text-content-dimmed" },
  in_progress: { label: "In progress", icon: <IconCircleDot size={14} />, color: "text-brand-1" },
  done: { label: "Done", icon: <IconCircleCheckCustom size={14} />, color: "text-success" },
  canceled: { label: "Canceled", icon: <IconCircleXCustom size={14} />, color: "text-content-dimmed" },
};

interface FilterOption {
  type: Types.FilterType;
  label: string;
  icon: React.ReactNode;
  operators: Types.FilterOperator[];
  hasSubmenu?: boolean;
}

const filterOptions: FilterOption[] = [
  { type: "status", label: "Status", icon: <IconCircle size={14} />, operators: ["is", "is_not"], hasSubmenu: true },
  { type: "assignee", label: "Assignee", icon: <IconUser size={14} />, operators: ["is", "is_not"], hasSubmenu: true },
  { type: "creator", label: "Creator", icon: <IconUser size={14} />, operators: ["is", "is_not"], hasSubmenu: true },
  {
    type: "milestone",
    label: "Milestone",
    icon: <IconFlag size={14} />,
    operators: ["is", "is_not"],
    hasSubmenu: true,
  },
  { type: "content", label: "Content", icon: <IconMessage size={14} />, operators: ["contains", "does_not_contain"] },
  { type: "due_date", label: "Due date", icon: <IconCalendar size={14} />, operators: ["before", "after", "between"] },
  {
    type: "created_date",
    label: "Created date",
    icon: <IconCalendar size={14} />,
    operators: ["before", "after", "between"],
  },
  {
    type: "updated_date",
    label: "Updated date",
    icon: <IconCalendar size={14} />,
    operators: ["before", "after", "between"],
  },
  {
    type: "started_date",
    label: "Started date",
    icon: <IconCalendar size={14} />,
    operators: ["before", "after", "between"],
  },
  {
    type: "completed_date",
    label: "Completed date",
    icon: <IconCalendar size={14} />,
    operators: ["before", "after", "between"],
  },
];

const operatorLabels: Record<Types.FilterOperator, string> = {
  is: "is",
  is_not: "is not",
  contains: "contains",
  does_not_contain: "does not contain",
  before: "before",
  after: "after",
  between: "between",
};

interface TaskFilterProps {
  filters: Types.FilterCondition[];
  onFiltersChange: (filters: Types.FilterCondition[]) => void;
  tasks: Types.Task[];
}

export function TaskFilter({ filters, onFiltersChange, tasks }: TaskFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredOption, setHoveredOption] = useState<Types.FilterType | null>(null);
  const [submenuVisible, setSubmenuVisible] = useState(false);
  const [submenuPosition, setSubmenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [selectedOption, setSelectedOption] = useState<FilterOption | null>(null);

  // Content filter modal state
  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [contentSearchTerm, setContentSearchTerm] = useState("");

  const searchInputRef = useRef<HTMLInputElement>(null);
  const hoveredOptionRef = useRef<HTMLButtonElement>(null);

  // Get unique people from tasks for assignee/creator filters (memoized)
  const availablePeople = useMemo(() => {
    return tasks
      .flatMap((task) => task.assignees || [])
      .filter((person, index, self) => index === self.findIndex((p) => p.id === person.id));
  }, [tasks]);

  // Get unique milestones from tasks (memoized)
  const availableMilestones = useMemo(() => {
    return tasks
      .filter((task) => task.milestone)
      .map((task) => task.milestone!)
      .filter((milestone, index, self) => index === self.findIndex((m) => m.id === milestone.id));
  }, [tasks]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Calculate submenu position when hovering
  const handleOptionHover = (option: FilterOption, element: HTMLButtonElement) => {
    setHoveredOption(option.type);

    if (option.hasSubmenu) {
      const rect = element.getBoundingClientRect();
      setSubmenuPosition({
        top: rect.top,
        left: rect.right + 4, // 4px gap
      });
      setSubmenuVisible(true);
    }
  };

  const handleOptionLeave = () => {
    // Use timeout to allow moving to submenu
    setTimeout(() => {
      // Check if we're still hovering over the main option or any submenu
      const isHoveringMainOption = hoveredOptionRef.current?.matches(":hover");
      const statusSubmenu = document.querySelector('[data-submenu="status"]');
      const assigneeSubmenu = document.querySelector('[data-submenu="assignee"]');
      const creatorSubmenu = document.querySelector('[data-submenu="creator"]');
      const milestoneSubmenu = document.querySelector('[data-submenu="milestone"]');

      const isHoveringSubmenu =
        statusSubmenu?.matches(":hover") ||
        assigneeSubmenu?.matches(":hover") ||
        creatorSubmenu?.matches(":hover") ||
        milestoneSubmenu?.matches(":hover");

      if (!isHoveringMainOption && !isHoveringSubmenu) {
        setSubmenuVisible(false);
        setHoveredOption(null);
      }
    }, 100);
  };

  // Filter options based on search query
  const filteredOptions = filterOptions.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleOptionSelect = (option: FilterOption) => {
    if (option.hasSubmenu) {
      // Don't close menu for options with submenu
      return;
    }

    if (option.type === "content") {
      // Open content filter modal
      setContentModalOpen(true);
      setIsOpen(false);
      return;
    }

    setSelectedOption(option);
    setSearchQuery("");
  };

  const handleStatusSelect = (status: Types.Status) => {
    const newFilter: Types.FilterCondition = {
      id: `filter-${Date.now()}`,
      type: "status",
      operator: "is",
      value: status,
      label: `Status is ${taskStatusConfig[status].label}`,
    };

    onFiltersChange([...filters, newFilter]);
    setIsOpen(false);
    setSubmenuVisible(false);
    setHoveredOption(null);
  };

  const handlePersonSelect = (person: Types.Person, filterType: "assignee" | "creator") => {
    const newFilter: Types.FilterCondition = {
      id: `filter-${Date.now()}`,
      type: filterType,
      operator: "is",
      value: person,
      label: `${filterType === "assignee" ? "Assignee" : "Creator"} is ${person.fullName}`,
    };

    onFiltersChange([...filters, newFilter]);
    setIsOpen(false);
    setSubmenuVisible(false);
    setHoveredOption(null);
  };

  const handleMilestoneSelect = (milestone: Types.Milestone) => {
    const newFilter: Types.FilterCondition = {
      id: `filter-${Date.now()}`,
      type: "milestone",
      operator: "is",
      value: milestone,
      label: `Milestone is ${milestone.name}`,
    };

    onFiltersChange([...filters, newFilter]);
    setIsOpen(false);
    setSubmenuVisible(false);
    setHoveredOption(null);
  };

  const handleContentFilterApply = () => {
    if (contentSearchTerm.trim()) {
      const newFilter: Types.FilterCondition = {
        id: `filter-${Date.now()}`,
        type: "content",
        operator: "contains",
        value: contentSearchTerm.trim(),
        label: `Content ${operatorLabels["contains"]} "${contentSearchTerm.trim()}"`,
      };

      onFiltersChange([...filters, newFilter]);
    }
    setContentModalOpen(false);
    setContentSearchTerm("");
  };

  const handleContentFilterCancel = () => {
    setContentModalOpen(false);
    setContentSearchTerm("");
  };

  // Handle keyboard events for content modal
  const handleContentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleContentFilterApply();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleContentFilterCancel();
    }
  };

  const handleOperatorSelect = (operator: Types.FilterOperator) => {
    // For now, just create a basic filter condition
    // In a real implementation, this would open a value selector
    if (selectedOption) {
      const newFilter: Types.FilterCondition = {
        id: `filter-${Date.now()}`,
        type: selectedOption.type,
        operator,
        value: null, // This would be set by a value selector
        label: `${selectedOption.label} ${operatorLabels[operator]}`,
      };

      onFiltersChange([...filters, newFilter]);
      setIsOpen(false);
      setSelectedOption(null);
    }
  };

  return (
    <div className="flex items-center">
      {/* Filter dropdown */}
      <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
        <Popover.Trigger asChild>
          <button className="inline-flex items-center gap-1.5 px-2 py-1 text-sm bg-surface-accent text-content-base border border-surface-outline rounded-md hover:bg-surface-accent-hover transition-colors">
            <IconFilter size={14} />
            Filter
            <IconChevronDown size={12} />
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            className="z-50 w-80 bg-surface-base border border-surface-outline rounded-lg shadow-lg p-0"
            sideOffset={4}
            align="start"
          >
            {!selectedOption ? (
              // Main filter options view
              <div className="p-3">
                {/* Search input */}
                <div className="relative mb-3">
                  <IconSearch
                    size={14}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-content-subtle"
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search filters..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-surface-outline rounded bg-surface-base text-content-base placeholder-content-subtle focus:outline-none focus:ring-1 focus:ring-primary-base"
                  />
                </div>

                {/* Filter options */}
                <div className="space-y-1">
                  {filteredOptions.slice(0, 5).map((option) => (
                    <button
                      key={option.type}
                      ref={hoveredOption === option.type ? hoveredOptionRef : null}
                      className={classNames(
                        "w-full flex items-center justify-between px-2 py-1.5 text-sm text-left rounded hover:bg-surface-accent",
                        hoveredOption === option.type && "bg-surface-accent",
                      )}
                      onMouseEnter={(e) => handleOptionHover(option, e.currentTarget)}
                      onMouseLeave={handleOptionLeave}
                      onClick={() => handleOptionSelect(option)}
                    >
                      <div className="flex items-center gap-2">
                        {option.icon}
                        <span>{option.label}</span>
                      </div>
                      {option.hasSubmenu && <IconChevronRight size={12} className="text-content-subtle" />}
                    </button>
                  ))}

                  {filteredOptions.length > 5 && (
                    <>
                      <div className="border-t border-surface-outline my-2" />
                      {filteredOptions.slice(5).map((option) => (
                        <button
                          key={option.type}
                          className={classNames(
                            "w-full flex items-center justify-between px-2 py-1.5 text-sm text-left rounded hover:bg-surface-accent",
                            hoveredOption === option.type && "bg-surface-accent",
                          )}
                          onMouseEnter={(e) => handleOptionHover(option, e.currentTarget)}
                          onMouseLeave={handleOptionLeave}
                          onClick={() => handleOptionSelect(option)}
                        >
                          <div className="flex items-center gap-2">
                            {option.icon}
                            <span>{option.label}</span>
                          </div>
                          {option.hasSubmenu && <IconChevronRight size={12} className="text-content-subtle" />}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>
            ) : (
              // Operator selection view
              <div className="p-3">
                <div className="flex items-center gap-2 mb-3 text-sm">
                  {selectedOption.icon}
                  <span className="font-medium">{selectedOption.label}</span>
                </div>

                <div className="space-y-1">
                  {selectedOption.operators.map((operator) => (
                    <button
                      key={operator}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-left rounded hover:bg-surface-accent"
                      onClick={() => handleOperatorSelect(operator)}
                    >
                      <span>{operatorLabels[operator]}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Popover.Content>
        </Popover.Portal>

        {/* Submenus */}
        <FilterSubmenu
          visible={submenuVisible && hoveredOption === "status"}
          position={submenuPosition}
          type="status"
          onMouseEnter={() => setSubmenuVisible(true)}
          onMouseLeave={() => {
            setSubmenuVisible(false);
            setHoveredOption(null);
          }}
        >
          {Object.entries(taskStatusConfig).map(([status, config]) => (
            <button
              key={status}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-left rounded hover:bg-surface-accent"
              onClick={() => handleStatusSelect(status as Types.Status)}
            >
              <span className={config.color}>{config.icon}</span>
              <span>{config.label}</span>
            </button>
          ))}
        </FilterSubmenu>

        <FilterSubmenu
          visible={submenuVisible && hoveredOption === "assignee"}
          position={submenuPosition}
          type="assignee"
          onMouseEnter={() => setSubmenuVisible(true)}
          onMouseLeave={() => {
            setSubmenuVisible(false);
            setHoveredOption(null);
          }}
        >
          {availablePeople.map((person) => (
            <button
              key={person.id}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-left rounded hover:bg-surface-accent whitespace-nowrap"
              onClick={() => handlePersonSelect(person, "assignee")}
            >
              <AvatarWithName person={person} size="tiny" nameFormat="full" />
            </button>
          ))}
          {availablePeople.length === 0 && (
            <div className="px-2 py-1.5 text-sm text-content-subtle">No assignees found</div>
          )}
        </FilterSubmenu>

        <FilterSubmenu
          visible={submenuVisible && hoveredOption === "creator"}
          position={submenuPosition}
          type="creator"
          onMouseEnter={() => setSubmenuVisible(true)}
          onMouseLeave={() => {
            setSubmenuVisible(false);
            setHoveredOption(null);
          }}
        >
          {availablePeople.map((person) => (
            <button
              key={person.id}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-left rounded hover:bg-surface-accent whitespace-nowrap"
              onClick={() => handlePersonSelect(person, "creator")}
            >
              <AvatarWithName person={person} size="tiny" nameFormat="full" />
            </button>
          ))}
          {availablePeople.length === 0 && (
            <div className="px-2 py-1.5 text-sm text-content-subtle">No people found</div>
          )}
        </FilterSubmenu>

        <FilterSubmenu
          visible={submenuVisible && hoveredOption === "milestone"}
          position={submenuPosition}
          type="milestone"
          onMouseEnter={() => setSubmenuVisible(true)}
          onMouseLeave={() => {
            setSubmenuVisible(false);
            setHoveredOption(null);
          }}
        >
          {availableMilestones.map((milestone) => (
            <button
              key={milestone.id}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-left rounded hover:bg-surface-accent"
              onClick={() => handleMilestoneSelect(milestone)}
            >
              <IconFlag size={14} className="text-blue-500" />
              <span>{milestone.name}</span>
            </button>
          ))}
          {availableMilestones.length === 0 && (
            <div className="px-2 py-1.5 text-sm text-content-subtle">No milestones found</div>
          )}
        </FilterSubmenu>
      </Popover.Root>

      {/* Content Filter Modal */}
      {contentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-surface-base border border-surface-outline rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-content-base mb-4">Search content</h3>

            <input
              type="text"
              value={contentSearchTerm}
              onChange={(e) => setContentSearchTerm(e.target.value)}
              onKeyDown={handleContentKeyDown}
              placeholder="Enter text to search for..."
              className="w-full px-3 py-2 text-sm border border-surface-outline rounded-md bg-surface-base text-content-base placeholder-content-subtle focus:outline-none focus:ring-1 focus:ring-primary-base mb-6"
              autoFocus
            />

            {/* Buttons */}
            <div className="flex justify-end gap-2">
              <SecondaryButton size="sm" onClick={handleContentFilterCancel}>
                Cancel
              </SecondaryButton>
              <PrimaryButton size="sm" onClick={handleContentFilterApply} disabled={!contentSearchTerm.trim()}>
                Apply Filter
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable submenu component
interface FilterSubmenuProps {
  visible: boolean;
  position: { top: number; left: number } | null;
  type: string;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  children: React.ReactNode;
}

function FilterSubmenu({ visible, position, type, onMouseEnter, onMouseLeave, children }: FilterSubmenuProps) {
  if (!visible || !position) return null;

  // Determine appropriate styling based on type
  const getSubmenuClassName = () => {
    const baseClass = "fixed z-[60] bg-surface-base border border-surface-outline rounded-lg shadow-lg p-2";

    switch (type) {
      case "assignee":
      case "creator":
        return `${baseClass} w-fit max-w-64`;
      case "status":
      case "milestone":
      default:
        return `${baseClass} min-w-48`;
    }
  };

  return (
    <div
      data-submenu={type}
      className={getSubmenuClassName()}
      style={{
        top: position.top,
        left: position.left,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  );
}

// Separate component for filter badges
export function FilterBadges({
  filters,
  onFiltersChange,
}: {
  filters: Types.FilterCondition[];
  onFiltersChange: (filters: Types.FilterCondition[]) => void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  const removeFilter = (filterId: string) => {
    onFiltersChange(filters.filter((f) => f.id !== filterId));
  };

  const updateFilterOperator = (filterId: string, newOperator: Types.FilterOperator) => {
    onFiltersChange(
      filters.map((f) => {
        if (f.id === filterId) {
          const filterOption = filterOptions.find((opt) => opt.type === f.type);
          const operatorLabel = operatorLabels[newOperator];
          let newLabel: string;

          if (f.type === "status") {
            const statusConfig = taskStatusConfig[f.value as Types.Status];
            newLabel = `Status ${operatorLabel} ${statusConfig.label}`;
          } else {
            newLabel = `${filterOption?.label || f.type} ${operatorLabel}`;
          }

          return {
            ...f,
            operator: newOperator,
            label: newLabel,
          };
        }
        return f;
      }),
    );
    setDropdownOpen(null);
  };

  const getFilterTypeLabel = (filter: Types.FilterCondition): string => {
    const filterOption = filterOptions.find((opt) => opt.type === filter.type);
    return filterOption?.label || filter.type;
  };

  const getFilterTypeIcon = (filter: Types.FilterCondition): React.ReactNode => {
    const filterOption = filterOptions.find((opt) => opt.type === filter.type);
    return filterOption?.icon;
  };

  const getFilterValueLabel = (filter: Types.FilterCondition): string => {
    if (filter.type === "status") {
      const statusConfig = taskStatusConfig[filter.value as Types.Status];
      return statusConfig.label;
    }
    if (filter.type === "assignee" || filter.type === "creator") {
      return filter.value?.fullName || "";
    }
    if (filter.type === "milestone") {
      return filter.value?.name || "";
    }
    if (filter.type === "content") {
      return `"${filter.value}"` || "";
    }
    return filter.value?.toString() || "";
  };

  const getFilterValueIcon = (filter: Types.FilterCondition): React.ReactNode => {
    if (filter.type === "status") {
      const statusConfig = taskStatusConfig[filter.value as Types.Status];
      return <span className={statusConfig.color}>{statusConfig.icon}</span>;
    }
    if (filter.type === "milestone") {
      return <IconFlag size={12} className="text-blue-500" />;
    }
    return null;
  };

  const getAvailableOperators = (filter: Types.FilterCondition): Types.FilterOperator[] => {
    const filterOption = filterOptions.find((opt) => opt.type === filter.type);
    return filterOption?.operators || [];
  };

  if (filters.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {filters.map((filter) => {
        const availableOperators = getAvailableOperators(filter);
        const hasMultipleOperators = availableOperators.length > 1;

        return (
          <div
            key={filter.id}
            className="flex items-center border border-surface-outline rounded-sm bg-surface-base text-sm overflow-hidden"
          >
            {/* Filter type segment */}
            <div className="flex items-center gap-1.5 px-2 py-1 bg-surface-dimmed">
              {getFilterTypeIcon(filter)}
              <span className="text-content-base font-medium">{getFilterTypeLabel(filter)}</span>
            </div>

            {/* Condition segment */}
            <div className="border-l border-surface-outline">
              {hasMultipleOperators ? (
                <Popover.Root
                  open={dropdownOpen === filter.id}
                  onOpenChange={(open) => setDropdownOpen(open ? filter.id : null)}
                >
                  <Popover.Trigger asChild>
                    <button className="flex items-center gap-1 px-2 py-1 bg-surface-accent hover:bg-surface-accent-hover text-content-base">
                      <span>{operatorLabels[filter.operator]}</span>
                      <IconChevronDown size={10} className="text-content-subtle" />
                    </button>
                  </Popover.Trigger>

                  <Popover.Portal>
                    <Popover.Content
                      className="z-50 bg-surface-base border border-surface-outline rounded-lg shadow-lg p-1 min-w-24"
                      sideOffset={4}
                      align="center"
                    >
                      {availableOperators.map((operator) => (
                        <button
                          key={operator}
                          className="w-full text-left px-2 py-1 text-sm rounded hover:bg-surface-accent"
                          onClick={() => updateFilterOperator(filter.id, operator)}
                        >
                          {operatorLabels[operator]}
                        </button>
                      ))}
                    </Popover.Content>
                  </Popover.Portal>
                </Popover.Root>
              ) : (
                <div className="px-2 py-1 bg-surface-accent text-content-base">
                  <span>{operatorLabels[filter.operator]}</span>
                </div>
              )}
            </div>

            {/* Value segment */}
            <div className="border-l border-surface-outline">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-surface-base">
                {getFilterValueIcon(filter)}
                <span className="text-content-base">{getFilterValueLabel(filter)}</span>
              </div>
            </div>

            {/* Remove button segment */}
            <div className="border-l border-surface-outline">
              <button
                onClick={() => removeFilter(filter.id)}
                className="px-1.5 py-1 bg-surface-base hover:bg-surface-accent-hover text-content-subtle hover:text-content-error"
              >
                <IconX size={12} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
