import * as React from "react";

import { IconCheck, IconChevronDown } from "../icons";
import { Menu, MenuActionItem } from "../Menu";
import classNames from "../utils/classnames";
import { NAME_AND_DATE_SORT_OPTIONS, type NameAndDateSortBy } from "../utils/sortWithFoldersFirst";

export interface SortControlProps {
  sortBy: NameAndDateSortBy;
  onSortChange: (sortBy: NameAndDateSortBy) => void;
  disabled?: boolean;
}

export function SortControl({ sortBy, onSortChange, disabled = false }: SortControlProps) {
  const currentOption = NAME_AND_DATE_SORT_OPTIONS.find((option) => option.value === sortBy);

  const trigger = (
    <button
      type="button"
      disabled={disabled}
      data-test-id="sort-control"
      className={classNames(
        "flex shrink-0 items-center gap-2 whitespace-nowrap px-3 py-1.5 text-sm text-content-dimmed border border-surface-outline rounded-md transition-colors",
        disabled ? "cursor-not-allowed opacity-50" : "hover:text-content-accent",
      )}
    >
      <span>Sort by {currentOption?.label}</span>
      <IconChevronDown size={14} />
    </button>
  );

  if (disabled) return trigger;

  return (
    <Menu testId="sort-control" size="tiny" customTrigger={trigger}>
      {NAME_AND_DATE_SORT_OPTIONS.map((option) => (
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
