import * as React from "react";
import { createPortal } from "react-dom";

import { IconSearch, IconX } from "../icons";
import { createTestId } from "../TestableElement";
import type { GlobalSearch } from "./index";
import { buildFullTextSearchOption, buildSearchGroups, type SearchGroup, type SearchOption } from "./searchOptions";

interface SearchOverlayProps {
  state: GlobalSearch.State;
  isOpen: boolean;
  onClose: () => void;
}

export function SearchOverlay({ state, isOpen, onClose }: SearchOverlayProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { query, setIsOpen, testId, setQuery } = state;
  const groups = React.useMemo(() => buildSearchGroups(state.results, testId), [state.results, testId]);
  const visibleGroups = state.isSearching || state.searchError ? [] : groups;
  const fullTextSearchOption = buildFullTextSearchOption(state);
  const options = visibleGroups.flatMap((group) => group.options);
  if (fullTextSearchOption) options.push(fullTextSearchOption);
  const listboxId = createTestId(testId, "results");
  const selectedOption = options[state.selectedIndex];

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  React.useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => inputRef.current?.focus());

      if (query.trim().length >= 2) {
        setIsOpen(true);
      }
    }
  }, [isOpen, query, setIsOpen]);

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case "ArrowDown":
        if (options.length > 0) {
          event.preventDefault();
          const nextIndex = state.selectedIndex + 1;
          state.setSelectedIndex(nextIndex >= options.length ? 0 : nextIndex);
        }
        break;
      case "ArrowUp":
        if (options.length > 0) {
          event.preventDefault();
          const previousIndex = state.selectedIndex - 1;
          state.setSelectedIndex(previousIndex < 0 ? options.length - 1 : previousIndex);
        }
        break;
      case "Enter":
        if (selectedOption) {
          event.preventDefault();
          navigateToResult(state, selectedOption.link, onClose);
        }
        break;
      case "Escape":
        event.preventDefault();
        onClose();
        break;
    }
  };

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[90]" onClick={onClose}>
      <div className="absolute inset-0 bg-stone-900/10 dark:bg-stone-900/60" />

      <div className="relative flex justify-center px-4" onClick={(event) => event.stopPropagation()}>
        <div className="w-[900px] max-w-[90vw] bg-surface-base border border-surface-outline rounded-lg shadow">
          <div className="relative">
            <IconSearch size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-content-dimmed" />
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-autocomplete="list"
              aria-controls={listboxId}
              aria-expanded={isOpen}
              aria-activedescendant={selectedOption?.optionId}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                state.setSearchError(false);
                state.setSelectedIndex(-1);
              }}
              onKeyDown={handleInputKeyDown}
              placeholder="Search for spaces, projects, goals, milestones, tasks, or people..."
              className="w-full pl-10 pr-12 py-2.5 text-base bg-surface-base border-b border-surface-outline focus:outline-none rounded-b-lg"
              data-test-id={testId}
            />
            <button
              type="button"
              aria-label="Close search"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-content-dimmed uppercase tracking-wide"
              onClick={onClose}
            >
              <IconX size={16} />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            <SearchResults
              state={state}
              onClose={onClose}
              groups={visibleGroups}
              options={options}
              fullTextSearchOption={fullTextSearchOption}
              listboxId={listboxId}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

interface SearchResultItemProps {
  option: SearchOption;
  isSelected: boolean;
  onClick: (link: string) => void;
}

function SearchResultItem({ option, isSelected, onClick }: SearchResultItemProps) {
  const optionRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isSelected) {
      optionRef.current?.scrollIntoView({ block: "nearest" });
    }
  }, [isSelected]);

  return (
    <div
      ref={optionRef}
      id={option.optionId}
      role="option"
      aria-selected={isSelected}
      className={`mx-1 px-2 py-2 rounded cursor-pointer transition-colors ${
        isSelected ? "bg-surface-highlight" : "hover:bg-surface-highlight"
      }`}
      onClick={() => onClick(option.link)}
      data-test-id={option.testId}
    >
      <div className="flex items-center gap-3">
        {option.icon}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate">{option.name}</div>
          {option.subtitle && <div className="text-xs text-content-dimmed truncate">{option.subtitle}</div>}
        </div>
      </div>
    </div>
  );
}

function SearchResults({
  state,
  onClose,
  groups,
  options,
  fullTextSearchOption,
  listboxId,
}: {
  state: GlobalSearch.State;
  onClose: () => void;
  groups: SearchGroup[];
  options: SearchOption[];
  fullTextSearchOption?: SearchOption;
  listboxId: string;
}) {
  const quickResultCount = groups.reduce((count, group) => count + group.options.length, 0);
  const hasListbox = quickResultCount > 0 || Boolean(fullTextSearchOption);

  if (!hasListbox && state.query.trim().length < 2) {
    return null;
  }

  const handleItemClick = (link: string) => {
    navigateToResult(state, link, onClose);
  };

  return (
    <>
      {state.isSearching && (
        <div role="status" aria-live="polite" className="p-4 text-center text-content-dimmed text-sm">
          Searching…
        </div>
      )}

      {!state.isSearching && state.searchError && (
        <div role="alert" className="p-4 text-center text-content-error text-sm">
          Quick search is unavailable.
        </div>
      )}

      {!state.isSearching && !state.searchError && quickResultCount === 0 && (
        <div role="status" aria-live="polite" className="p-4 text-center text-content-dimmed text-sm">
          No title or name matches for “{state.query.trim()}”.
        </div>
      )}

      {!state.isSearching && !state.searchError && quickResultCount > 0 && (
        <div role="status" aria-live="polite" className="sr-only">
          {quickResultCount} {quickResultCount === 1 ? "result" : "results"}
        </div>
      )}

      {hasListbox && (
        <div id={listboxId} role="listbox" aria-label="Quick search results" className="py-1">
          {groups.map((group) => (
            <div key={group.title} role="group" aria-label={group.title} className="mb-2 last:mb-0">
              <SearchResultGroupHeader title={group.title} />
              {group.options.map((option) => (
                <SearchResultItem
                  key={`${option.resourceType}-${option.id}`}
                  option={option}
                  isSelected={options[state.selectedIndex]?.optionId === option.optionId}
                  onClick={handleItemClick}
                />
              ))}
            </div>
          ))}

          {fullTextSearchOption && (
            <div role="presentation" className="mt-1 border-t border-surface-outline pt-1">
              <SearchResultItem
                option={fullTextSearchOption}
                isSelected={options[state.selectedIndex]?.optionId === fullTextSearchOption.optionId}
                onClick={handleItemClick}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}

function navigateToResult(state: GlobalSearch.State, link: string, onClose: () => void) {
  state.onNavigate(link);
  state.setIsOpen(false);
  state.setQuery("");
  state.setSelectedIndex(-1);
  onClose();
}

function SearchResultGroupHeader({ title }: { title: string }) {
  return (
    <div className="px-3 py-0.5 text-xs font-medium text-content-dimmed" aria-hidden="true">
      {title}
    </div>
  );
}
