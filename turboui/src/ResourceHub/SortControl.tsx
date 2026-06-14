import * as React from "react";
import { IconCheck, IconChevronDown } from "../icons";
import { Menu, MenuActionItem } from "../Menu";
import { NAME_AND_DATE_SORT_OPTIONS } from "../utils/sortWithFoldersFirst";
import type { ResourceHubSortBy } from "./types";

interface SortControlProps {
  sortBy: ResourceHubSortBy;
  onSortChange: (sortBy: ResourceHubSortBy) => void;
}

export function SortControl({ sortBy, onSortChange }: SortControlProps) {
  const currentOption = NAME_AND_DATE_SORT_OPTIONS.find((option) => option.value === sortBy);

  const trigger = (
    <button className="flex items-center gap-2 px-3 py-2 text-sm text-content-dimmed hover:text-content-accent border border-surface-outline rounded-md transition-colors">
      <span>Sort by {currentOption?.label}</span>
      <IconChevronDown size={14} />
    </button>
  );

  return (
    <Menu testId="sort-control" size="tiny" customTrigger={trigger}>
      {NAME_AND_DATE_SORT_OPTIONS.map((option) => (
        <MenuActionItem key={option.value} onClick={() => onSortChange(option.value)} testId={`sort-option-${option.value}`}>
          <div className="flex items-center justify-between w-full">
            <span>{option.label}</span>
            {sortBy === option.value && <IconCheck size={16} />}
          </div>
        </MenuActionItem>
      ))}
    </Menu>
  );
}
