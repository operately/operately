import React from "react";
import { IconCheck, IconChevronDown, Menu, MenuActionItem } from "turboui";
import { SortBy } from "./utils";

export interface SortControlProps {
  sortBy: SortBy;
  onSortChange: (sortBy: SortBy) => void;
}

const SORT_OPTIONS = [
  { value: "name" as SortBy, label: "Name" },
  { value: "insertedAt" as SortBy, label: "Creation Date" },
  { value: "updatedAt" as SortBy, label: "Modified Date" },
];

export function SortControl({ sortBy, onSortChange }: SortControlProps) {
  const currentOption = SORT_OPTIONS.find((option) => option.value === sortBy);

  const trigger = (
    <button className="flex items-center gap-2 px-3 py-2 text-sm text-content-dimmed hover:text-content-accent border border-surface-outline rounded-md transition-colors">
      <span>Sort by {currentOption?.label}</span>
      <IconChevronDown size={14} />
    </button>
  );

  return (
    <Menu testId="sort-control" size="tiny" customTrigger={trigger}>
      {SORT_OPTIONS.map((option) => (
        <MenuActionItem
          key={option.value}
          onClick={() => onSortChange(option.value)}
          testId={`sort-option-${option.value}`}
        >
          <div className="flex items-center justify-between w-full">
            <span>{option.label}</span>
            {sortBy === option.value && <IconCheck size={16} />}
          </div>
        </MenuActionItem>
      ))}
    </Menu>
  );
}
