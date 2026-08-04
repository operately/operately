import * as React from "react";

import { IconCheck, IconChevronDown } from "../icons";
import { Menu, MenuActionItem } from "../Menu";
import { Tooltip } from "../Tooltip";
import classNames from "../utils/classnames";

export type SortMode = "best_match" | "most_recent";

export interface RefineFilterOption {
  id: string;
  label: string;
}

export interface RefineFilter {
  id: string;
  label: string;
  icon: React.ElementType;
  selectionMode: "single" | "multiple";
  options: RefineFilterOption[];
  selectedOptionIds: string[];
}

export interface RefineControlsProps {
  sort: SortMode;
  onSortChange: (sort: SortMode) => void;
  filters: RefineFilter[];
  onFilterChange: (filterId: string, selectedOptionIds: string[]) => void;
}

const SORT_OPTIONS: Array<{ id: SortMode; label: string }> = [
  { id: "best_match", label: "Best match" },
  { id: "most_recent", label: "Most recent" },
];

export function RefineControls({ sort, onSortChange, filters, onFilterChange }: RefineControlsProps) {
  return (
    <div
      role="group"
      aria-label="Refine results"
      className="mt-3 flex flex-wrap items-center justify-start gap-x-8 gap-y-2"
      data-test-id="search-refine-controls"
    >
      <SortToggle sort={sort} onSortChange={onSortChange} />
      {filters.map((filter) => (
        <FilterChip key={filter.id} filter={filter} onFilterChange={onFilterChange} />
      ))}
    </div>
  );
}

function SortToggle({ sort, onSortChange }: Pick<RefineControlsProps, "sort" | "onSortChange">) {
  return (
    <div
      role="group"
      aria-label="Sort results"
      className="inline-flex shrink-0 rounded-full bg-surface-dimmed p-0.5"
      data-test-id="search-sort-toggle"
    >
      {SORT_OPTIONS.map((option) => {
        const selected = sort === option.id;

        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            data-test-id={`search-sort-${option.id}`}
            onClick={() => onSortChange(option.id)}
            className={classNames(
              "rounded-full px-2.5 py-1 text-xs transition-colors",
              selected
                ? "bg-surface-base font-semibold text-content-accent shadow-sm"
                : "font-medium text-content-dimmed hover:text-content-base",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function FilterChip({
  filter,
  onFilterChange,
}: {
  filter: RefineFilter;
  onFilterChange: RefineControlsProps["onFilterChange"];
}) {
  const Icon = filter.icon;
  const selectedOptions = filter.options.filter((option) => filter.selectedOptionIds.includes(option.id));
  const selectedCount = selectedOptions.length;
  const isMultiple = filter.selectionMode === "multiple";
  const displayLabel = !isMultiple && selectedOptions[0] ? selectedOptions[0].label : filter.label;
  const [menuOpen, setMenuOpen] = React.useState(false);

  const trigger = (
    <button
      type="button"
      className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-content-dimmed transition-colors hover:text-content-base"
      data-test-id={`search-filter-${filter.id}`}
    >
      <Icon size={18} aria-hidden="true" className="shrink-0" />
      <span>{displayLabel}</span>
      {isMultiple && selectedCount > 0 ? (
        <span
          className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-surface-dimmed px-1.5 text-xs font-semibold text-content-accent"
          data-test-id={`search-filter-${filter.id}-count`}
        >
          {selectedCount}
        </span>
      ) : null}
      <IconChevronDown size={14} aria-hidden="true" className="shrink-0 opacity-70" />
    </button>
  );

  const menu = (
    <Menu testId={`search-filter-${filter.id}`} size="small" align="start" customTrigger={trigger} onOpenChange={setMenuOpen}>
      {filter.options.map((option) => {
        const selected = filter.selectedOptionIds.includes(option.id);

        return (
          <MenuActionItem
            key={option.id}
            testId={`search-filter-${filter.id}-option-${option.id}`}
            keepOpen={isMultiple}
            onClick={() => {
              if (isMultiple) {
                const next = selected
                  ? filter.selectedOptionIds.filter((id) => id !== option.id)
                  : [...filter.selectedOptionIds, option.id];
                onFilterChange(filter.id, next);
                return;
              }

              onFilterChange(filter.id, selected ? [] : [option.id]);
            }}
          >
            <div className="flex w-full items-center justify-between gap-4">
              <span>{option.label}</span>
              {selected ? <IconCheck size={16} /> : null}
            </div>
          </MenuActionItem>
        );
      })}
    </Menu>
  );

  if (isMultiple) {
    return (
      <Tooltip
        content={selectedOptions.map((option) => option.label).join(", ")}
        size="sm"
        disabled={menuOpen || selectedCount === 0}
        testId={`search-filter-${filter.id}-tooltip`}
      >
        <span className="inline-flex shrink-0">{menu}</span>
      </Tooltip>
    );
  }

  return menu;
}
