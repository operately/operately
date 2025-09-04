import React from "react";
import { Menu } from "turboui";
import { IconChevronDown, IconCheck } from "turboui";
import { SortBy } from "./utils";

export interface SortControlProps {
  sortBy: SortBy;
  onSortChange: (sortBy: SortBy) => void;
}

const SORT_OPTIONS = [
  { value: "name" as SortBy, label: "Name" },
  { value: "insertedAt" as SortBy, label: "Date Created" },
  { value: "updatedAt" as SortBy, label: "Date Modified" },
];

export function SortControl({ sortBy, onSortChange }: SortControlProps) {
  const currentOption = SORT_OPTIONS.find(option => option.value === sortBy);

  return (
    <Menu
      testId="sort-control"
      customTrigger={
        <button className="flex items-center gap-2 px-3 py-2 text-sm text-content-dimmed hover:text-content-accent border border-stroke-base rounded-md hover:border-stroke-hover transition-colors">
          <span>Sort by: {currentOption?.label}</span>
          <IconChevronDown size={14} />
        </button>
      }
    >
      {SORT_OPTIONS.map((option) => (
        <Menu.ActionItem
          key={option.value}
          onClick={() => onSortChange(option.value)}
          testId={`sort-option-${option.value}`}
        >
          <div className="flex items-center justify-between w-full">
            <span>{option.label}</span>
            {sortBy === option.value && <IconCheck size={16} />}
          </div>
        </Menu.ActionItem>
      ))}
    </Menu>
  );
}