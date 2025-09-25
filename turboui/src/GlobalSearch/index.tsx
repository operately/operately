import * as React from "react";
import { createPortal } from "react-dom";

import { IconBriefcase, IconCheck, IconGoal, IconSearch, IconUser } from "../icons";
import { createTestId } from "../TestableElement";

export namespace GlobalSearch {
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
    milestone?: {
      project?: {
        name: string;
        space?: { name: string } | null;
      } | null;
    } | null;
  }

  export interface Person {
    id: string;
    fullName: string;
    title?: string | null;
    link: string;
  }

  export interface SearchResult {
    projects?: Project[] | null;
    goals?: Goal[] | null;
    tasks?: Task[] | null;
    people?: Person[] | null;
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
  }
}

function useGlobalSearchState(props: GlobalSearch.Props): GlobalSearch.State {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<GlobalSearch.SearchResult>({});
  const [isSearching, setIsSearching] = React.useState(false);

  const searchTimeoutRef = React.useRef<NodeJS.Timeout>();

  const performSearch = React.useCallback(
    async (searchQuery: string) => {
      if (searchQuery.trim().length < 2) {
        setResults({});
        setIsOpen(false);
        return;
      }

      setIsSearching(true);
      try {
        const searchResults = await props.search({ query: searchQuery.trim() });
        setResults(searchResults);
        setIsOpen(true);
      } catch (error) {
        console.error("Search failed:", error);
        setResults({});
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
  };
}

function SearchResults({ state, onClose }: { state: GlobalSearch.State; onClose: () => void }) {
  const hasResults = React.useMemo(() => {
    const { projects, goals, tasks, people } = state.results;
    return (
      (projects && projects.length > 0) ||
      (goals && goals.length > 0) ||
      (tasks && tasks.length > 0) ||
      (people && people.length > 0)
    );
  }, [state.results]);

  if (state.isSearching) {
    return <div className="p-4 text-center text-content-dimmed text-sm">Searching...</div>;
  }

  if (!hasResults && state.query.length >= 2) {
    return <div className="p-4 text-center text-content-dimmed text-sm">No results found for "{state.query}"</div>;
  }

  if (!hasResults) {
    return null;
  }

  const handleItemClick = (link: string) => {
    state.onNavigate(link);
    state.setIsOpen(false);
    state.setQuery("");
    onClose();
  };

  return (
    <div className="py-1">
      {/* Projects */}
      {state.results.projects && state.results.projects.length > 0 && (
        <div className="mb-2">
          <div className="px-3 py-1 text-xs font-medium text-content-subtle">PROJECTS</div>
          {state.results.projects.map((project) => (
            <div
              key={project.id}
              className="mx-1 px-2 py-2 rounded hover:bg-surface-dimmed cursor-pointer"
              onClick={() => handleItemClick(project.link)}
              data-test-id={createTestId(state.testId, "project", project.name)}
            >
              <div className="flex items-center gap-2">
                <IconBriefcase size={16} className="text-content-subtle" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{project.name}</div>
                  {(project.champion || project.space) && (
                    <div className="text-xs text-content-dimmed">
                      {[project.champion?.fullName, project.space?.name].filter(Boolean).join(" • ")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Goals */}
      {state.results.goals && state.results.goals.length > 0 && (
        <div className="mb-2">
          <div className="px-3 py-1 text-xs font-medium text-content-subtle">GOALS</div>
          {state.results.goals.map((goal) => (
            <div
              key={goal.id}
              className="mx-1 px-2 py-2 rounded hover:bg-surface-dimmed cursor-pointer"
              onClick={() => handleItemClick(goal.link)}
              data-test-id={createTestId(state.testId, "goal", goal.name)}
            >
              <div className="flex items-center gap-2">
                <IconGoal size={16} className="text-content-subtle" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{goal.name}</div>
                  {(goal.champion || goal.space) && (
                    <div className="text-xs text-content-dimmed">
                      {[goal.champion?.fullName, goal.space?.name].filter(Boolean).join(" • ")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tasks */}
      {state.results.tasks && state.results.tasks.length > 0 && (
        <div className="mb-2">
          <div className="px-3 py-1 text-xs font-medium text-content-subtle">TASKS</div>
          {state.results.tasks.map((task) => (
            <div
              key={task.id}
              className="mx-1 px-2 py-2 rounded hover:bg-surface-dimmed cursor-pointer"
              onClick={() => handleItemClick(task.link)}
              data-test-id={createTestId(state.testId, "task", task.name)}
            >
              <div className="flex items-center gap-2">
                <IconCheck size={16} className="text-content-subtle" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{task.name}</div>
                  {task.milestone?.project && (
                    <div className="text-xs text-content-dimmed">
                      {[task.milestone.project.name, task.milestone.project.space?.name].filter(Boolean).join(" • ")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* People */}
      {state.results.people && state.results.people.length > 0 && (
        <div>
          <div className="px-3 py-1 text-xs font-medium text-content-subtle">PEOPLE</div>
          {state.results.people.map((person) => (
            <div
              key={person.id}
              className="mx-1 px-2 py-2 rounded hover:bg-surface-dimmed cursor-pointer"
              onClick={() => handleItemClick(person.link)}
              data-test-id={createTestId(state.testId, "person", person.fullName)}
            >
              <div className="flex items-center gap-2">
                <IconUser size={16} className="text-content-subtle" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{person.fullName}</div>
                  {person.title && <div className="text-xs text-content-dimmed truncate">{person.title}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
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
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search for projects, goals, tasks, or people..."
              className="w-full pl-10 pr-12 py-2.5 text-base bg-surface-base border-b border-surface-outline focus:outline-none rounded-b-lg"
              data-test-id={testId}
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-content-dimmed uppercase tracking-wide"
              onClick={onClose}
            >
              Esc
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            <SearchResults state={state} onClose={onClose} />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function SearchActivator({ placeholder, onActivate }: { placeholder: string; onActivate: () => void }) {
  return (
    <button
      type="button"
      onClick={onActivate}
      className="w-[250px] flex items-center gap-2 px-3 py-1.5 -mb-0.5 text-sm text-content-dimmed bg-transparent border border-surface-outline rounded-lg hover:bg-surface-dimmed transition"
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

  const openOverlay = React.useCallback(() => {
    setOverlayOpen(true);
  }, []);

  const closeOverlay = React.useCallback(() => {
    setOverlayOpen(false);
    state.setIsOpen(false);
  }, [state]);

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
      <SearchActivator placeholder={state.placeholder} onActivate={openOverlay} />
      <SearchOverlay state={state} isOpen={overlayOpen} onClose={closeOverlay} />
    </>
  );
}
