import * as React from "react";
import { createPortal } from "react-dom";

import { Avatar } from "../Avatar";
import {
  IconFile,
  IconFileText,
  IconFolderFilled,
  IconGoal,
  IconLink,
  IconMessage,
  IconMilestone,
  IconProject,
  IconSearch,
  IconTask,
  IconTent,
  IconX,
} from "../icons";
import { createTestId } from "../TestableElement";

export namespace GlobalSearch {
  export interface Space {
    id: string;
    name: string;
    link: string;
  }

  export interface Project {
    id: string;
    name: string;
    link: string;
    champion?: { fullName: string } | null;
    space?: { name: string } | null;
  }

  export interface Goal {
    id: string;
    name: string;
    link: string;
    champion?: { fullName: string } | null;
    space?: { name: string } | null;
  }

  export interface Task {
    id: string;
    name: string;
    link: string;
    project?: { name: string } | null;
    space?: { name: string } | null;
  }

  export interface Milestone {
    id: string;
    title: string;
    link: string;
    project?: { name: string } | null;
    space?: { name: string } | null;
  }

  export interface Person {
    id: string;
    fullName: string;
    title?: string | null;
    link: string;
    avatarUrl?: string | null;
  }

  export interface Resource {
    id: string;
    name: string;
    context: string;
    link: string;
  }

  export interface SearchResult {
    spaces?: Space[] | null;
    projects?: Project[] | null;
    goals?: Goal[] | null;
    milestones?: Milestone[] | null;
    tasks?: Task[] | null;
    people?: Person[] | null;
    discussions?: Resource[] | null;
    folders?: Resource[] | null;
    documents?: Resource[] | null;
    files?: Resource[] | null;
    links?: Resource[] | null;
  }

  export type SearchFn = (params: { query: string }) => Promise<SearchResult>;

  export interface Props {
    search: SearchFn;
    onNavigate: (link: string) => void;
    placeholder?: string;
    testId?: string;
  }

  export interface State extends Required<Props> {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;

    query: string;
    setQuery: (query: string) => void;

    results: SearchResult;
    setResults: (results: SearchResult) => void;

    isSearching: boolean;
    setIsSearching: (searching: boolean) => void;

    searchError: boolean;
    setSearchError: (hasError: boolean) => void;

    selectedIndex: number;
    setSelectedIndex: (index: number) => void;
  }
}

interface SearchOption {
  id: string;
  optionId: string;
  type: string;
  name: string;
  link: string;
  icon: React.ReactNode;
  subtitle?: string;
  testId: string;
}

interface SearchGroup {
  title: string;
  options: SearchOption[];
}

function useGlobalSearchState(props: GlobalSearch.Props): GlobalSearch.State {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<GlobalSearch.SearchResult>({});
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchError, setSearchError] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(-1);

  const searchTimeoutRef = React.useRef<ReturnType<typeof setTimeout>>();

  const performSearch = React.useCallback(
    async (searchQuery: string) => {
      if (searchQuery.trim().length < 2) {
        setResults({});
        setSearchError(false);
        setSelectedIndex(-1);
        setIsOpen(false);
        return;
      }

      setIsSearching(true);
      setSearchError(false);

      try {
        const searchResults = await props.search({ query: searchQuery.trim() });
        setResults(searchResults);
        setSelectedIndex(-1);
        setIsOpen(true);
      } catch {
        setResults({});
        setSearchError(true);
        setSelectedIndex(-1);
      } finally {
        setIsSearching(false);
      }
    },
    [props.search],
  );

  React.useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, performSearch]);

  return {
    ...props,
    placeholder: props.placeholder ?? "Search...",
    testId: props.testId ?? "global-search",
    isOpen,
    setIsOpen,
    query,
    setQuery,
    results,
    setResults,
    isSearching,
    setIsSearching,
    searchError,
    setSearchError,
    selectedIndex,
    setSelectedIndex,
  };
}

function buildSearchGroups(results: GlobalSearch.SearchResult, testId: string): SearchGroup[] {
  const groups: SearchGroup[] = [
    {
      title: "SPACES",
      options: (results.spaces ?? []).map((space) =>
        buildOption(testId, "space", space.id, space.name, space.link, <IconTent size={24} />),
      ),
    },
    {
      title: "GOALS",
      options: (results.goals ?? []).map((goal) =>
        buildOption(
          testId,
          "goal",
          goal.id,
          goal.name,
          goal.link,
          <IconGoal size={24} />,
          compactContext(goal.champion?.fullName, goal.space?.name),
        ),
      ),
    },
    {
      title: "PROJECTS",
      options: (results.projects ?? []).map((project) =>
        buildOption(
          testId,
          "project",
          project.id,
          project.name,
          project.link,
          <IconProject size={24} />,
          compactContext(project.champion?.fullName, project.space?.name),
        ),
      ),
    },
    {
      title: "MILESTONES",
      options: (results.milestones ?? []).map((milestone) =>
        buildOption(
          testId,
          "milestone",
          milestone.id,
          milestone.title,
          milestone.link,
          <IconMilestone size={24} />,
          compactContext(milestone.project?.name, milestone.space?.name),
        ),
      ),
    },
    {
      title: "TASKS",
      options: (results.tasks ?? []).map((task) =>
        buildOption(
          testId,
          "task",
          task.id,
          task.name,
          task.link,
          <IconTask size={24} />,
          compactContext(task.project?.name, task.space?.name),
        ),
      ),
    },
    {
      title: "PEOPLE",
      options: (results.people ?? []).map((person) =>
        buildOption(
          testId,
          "person",
          person.id,
          person.fullName,
          person.link,
          <Avatar person={person} size={24} />,
          person.title || undefined,
        ),
      ),
    },
    resourceGroup(testId, "DISCUSSIONS", "discussion", results.discussions, <IconMessage size={24} />),
    resourceGroup(testId, "FOLDERS", "folder", results.folders, <IconFolderFilled size={24} />),
    resourceGroup(testId, "DOCUMENTS", "document", results.documents, <IconFileText size={24} />),
    resourceGroup(testId, "FILES", "file", results.files, <IconFile size={24} />),
    resourceGroup(testId, "LINKS", "link", results.links, <IconLink size={24} />),
  ];

  return groups.filter((group) => group.options.length > 0);
}

function resourceGroup(
  testId: string,
  title: string,
  type: string,
  resources: GlobalSearch.Resource[] | null | undefined,
  icon: React.ReactNode,
): SearchGroup {
  return {
    title,
    options: (resources ?? []).map((resource) =>
      buildOption(testId, type, resource.id, resource.name, resource.link, icon, resource.context),
    ),
  };
}

function buildOption(
  testId: string,
  type: string,
  id: string,
  name: string,
  link: string,
  icon: React.ReactNode,
  subtitle?: string,
): SearchOption {
  return {
    id,
    optionId: createTestId(testId, "option", type, id),
    type,
    name,
    link,
    icon,
    subtitle,
    testId: createTestId(testId, type, name),
  };
}

function compactContext(...parts: Array<string | null | undefined>): string | undefined {
  const context = parts.filter(Boolean).join(" • ");
  return context || undefined;
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
  listboxId,
}: {
  state: GlobalSearch.State;
  onClose: () => void;
  groups: SearchGroup[];
  options: SearchOption[];
  listboxId: string;
}) {
  if (state.isSearching) {
    return (
      <div role="status" aria-live="polite" className="p-4 text-center text-content-dimmed text-sm">
        Searching…
      </div>
    );
  }

  if (state.searchError) {
    return (
      <div role="alert" className="p-4 text-center text-content-error text-sm">
        Quick search is unavailable.
      </div>
    );
  }

  if (groups.length === 0 && state.query.trim().length >= 2) {
    return (
      <div role="status" aria-live="polite" className="p-4 text-center text-content-dimmed text-sm">
        No title or name matches for “{state.query.trim()}”.
      </div>
    );
  }

  if (groups.length === 0) {
    return null;
  }

  const handleItemClick = (link: string) => {
    navigateToResult(state, link, onClose);
  };

  return (
    <>
      <div role="status" aria-live="polite" className="sr-only">
        {options.length} {options.length === 1 ? "result" : "results"}
      </div>
      <div id={listboxId} role="listbox" aria-label="Quick search results" className="py-1">
        {groups.map((group) => (
          <div key={group.title} role="group" aria-label={group.title} className="mb-2 last:mb-0">
            <SearchResultGroupHeader title={group.title} />
            {group.options.map((option) => (
              <SearchResultItem
                key={`${option.type}-${option.id}`}
                option={option}
                isSelected={options[state.selectedIndex]?.optionId === option.optionId}
                onClick={handleItemClick}
              />
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

interface SearchOverlayProps {
  state: GlobalSearch.State;
  isOpen: boolean;
  onClose: () => void;
}

function SearchOverlay({ state, isOpen, onClose }: SearchOverlayProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { query, setIsOpen, testId, setQuery } = state;
  const groups = React.useMemo(() => buildSearchGroups(state.results, testId), [state.results, testId]);
  const options = React.useMemo(() => groups.flatMap((group) => group.options), [groups]);
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
            <SearchResults state={state} onClose={onClose} groups={groups} options={options} listboxId={listboxId} />
          </div>
        </div>
      </div>
    </div>,
    document.body,
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

function SearchActivator({
  placeholder,
  onActivate,
  testId,
}: {
  placeholder: string;
  onActivate: () => void;
  testId?: string;
}) {
  return (
    <button
      type="button"
      onClick={onActivate}
      className="w-[250px] flex items-center gap-2 px-3 py-1.5 -mb-0.5 text-sm text-content-dimmed bg-transparent border border-surface-outline rounded-lg hover:bg-surface-dimmed transition"
      data-test-id={testId ? `${testId}-activator` : undefined}
    >
      <IconSearch size={14} className="text-content-dimmed" />
      <span className="flex-1 text-left truncate">{placeholder}</span>
      <span className="text-xs">⌘K</span>
    </button>
  );
}

export function GlobalSearch(props: GlobalSearch.Props) {
  const state = useGlobalSearchState(props);
  const [overlayOpen, setOverlayOpen] = React.useState(false);
  const { setIsOpen, setSelectedIndex } = state;

  const openOverlay = React.useCallback(() => {
    setOverlayOpen(true);
  }, []);

  const closeOverlay = React.useCallback(() => {
    setOverlayOpen(false);
    setIsOpen(false);
    setSelectedIndex(-1);
  }, [setIsOpen, setSelectedIndex]);

  React.useEffect(() => {
    const handleGlobalShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openOverlay();
      }
    };

    document.addEventListener("keydown", handleGlobalShortcut);
    return () => document.removeEventListener("keydown", handleGlobalShortcut);
  }, [openOverlay]);

  return (
    <>
      <SearchActivator placeholder={state.placeholder} onActivate={openOverlay} testId={state.testId} />
      <SearchOverlay state={state} isOpen={overlayOpen} onClose={closeOverlay} />
    </>
  );
}
