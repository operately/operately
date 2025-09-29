import * as React from "react";
import { createPortal } from "react-dom";

import { Avatar } from "../Avatar";
import { IconGoal, IconProject, IconSearch, IconTask, IconX } from "../icons";
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

  export interface FlatResult {
    type: 'project' | 'goal' | 'task' | 'person';
    item: Project | Goal | Task | Person;
    link: string;
  }

  export type SearchResult = FlatResult[];

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

    selectedIndex: number;
    setSelectedIndex: (index: number) => void;
  }
}

function useGlobalSearchState(props: GlobalSearch.Props): GlobalSearch.State {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<GlobalSearch.SearchResult>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(-1);

  const searchTimeoutRef = React.useRef<any>();

  const performSearch = React.useCallback(
    async (searchQuery: string) => {
      if (searchQuery.trim().length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setIsSearching(true);

      try {
        const searchResults = await props.search({ query: searchQuery.trim() });
        setResults(searchResults);
        setSelectedIndex(-1); // Reset selection when results change
        setIsOpen(true);
      } catch (error) {
        console.error("Search failed:", error);
        setResults([]);
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
    selectedIndex,
    setSelectedIndex,
  };
}

interface SearchResultItemProps {
  id: string;
  name: string;
  link: string;
  icon: React.ReactNode;
  subtitle?: string;
  isSelected: boolean;
  onClick: (link: string) => void;
  testId: string;
}

function SearchResultItem({ id, name, link, icon, subtitle, isSelected, onClick, testId }: SearchResultItemProps) {
  return (
    <div
      key={id}
      className={`mx-1 px-2 py-2 rounded cursor-pointer transition-colors ${
        isSelected ? "bg-surface-highlight" : "hover:bg-surface-highlight"
      }`}
      onClick={() => onClick(link)}
      data-test-id={testId}
    >
      <div className="flex items-center gap-3">
        {icon}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate">{name}</div>
          {subtitle && <div className="text-xs text-content-dimmed truncate">{subtitle}</div>}
        </div>
      </div>
    </div>
  );
}

export function SearchResults({
  state,
  onClose,
}: {
  state: GlobalSearch.State;
  onClose: () => void;
}) {
  const hasResults = state.results.length > 0;
  
  // Group flat results by type for rendering
  const groupedResults = React.useMemo(() => {
    const groups = {
      projects: [] as GlobalSearch.Project[],
      goals: [] as GlobalSearch.Goal[],
      tasks: [] as GlobalSearch.Task[],
      people: [] as GlobalSearch.Person[],
    };
    
    state.results.forEach((result) => {
      switch (result.type) {
        case 'project':
          groups.projects.push(result.item as GlobalSearch.Project);
          break;
        case 'goal':
          groups.goals.push(result.item as GlobalSearch.Goal);
          break;
        case 'task':
          groups.tasks.push(result.item as GlobalSearch.Task);
          break;
        case 'person':
          groups.people.push(result.item as GlobalSearch.Person);
          break;
      }
    });
    
    return groups;
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
    state.setSelectedIndex(-1);
    onClose();
  };

  const getCurrentIndex = (type: string, itemId: string) => {
    return state.results.findIndex((result) => result.type === type && result.item.id === itemId);
  };

  return (
    <div className="py-1">
      {/* Projects */}
      {groupedResults.projects.length > 0 && (
        <div className="mb-2">
          <SearchResultGroupHeader title="PROJECTS" />

          {groupedResults.projects.map((project) => {
            const currentIndex = getCurrentIndex("project", project.id);
            const isSelected = currentIndex === state.selectedIndex;
            const subtitle = [project.champion?.fullName, project.space?.name].filter(Boolean).join(" • ");

            return (
              <SearchResultItem
                key={project.id}
                id={project.id}
                name={project.name}
                link={project.link}
                icon={<IconProject size={24} />}
                subtitle={subtitle || undefined}
                isSelected={isSelected}
                onClick={handleItemClick}
                testId={createTestId(state.testId, "project", project.name)}
              />
            );
          })}
        </div>
      )}

      {/* Goals */}
      {groupedResults.goals.length > 0 && (
        <div className="mb-2">
          <SearchResultGroupHeader title="GOALS" />

          {groupedResults.goals.map((goal) => {
            const currentIndex = getCurrentIndex("goal", goal.id);
            const isSelected = currentIndex === state.selectedIndex;
            const subtitle = [goal.champion?.fullName, goal.space?.name].filter(Boolean).join(" • ");

            return (
              <SearchResultItem
                key={goal.id}
                id={goal.id}
                name={goal.name}
                link={goal.link}
                icon={<IconGoal size={24} />}
                subtitle={subtitle || undefined}
                isSelected={isSelected}
                onClick={handleItemClick}
                testId={createTestId(state.testId, "goal", goal.name)}
              />
            );
          })}
        </div>
      )}

      {/* Tasks */}
      {groupedResults.tasks.length > 0 && (
        <div className="mb-2">
          <SearchResultGroupHeader title="TASKS" />

          {groupedResults.tasks.map((task) => {
            const currentIndex = getCurrentIndex("task", task.id);
            const isSelected = currentIndex === state.selectedIndex;
            const subtitle = task.milestone?.project
              ? [task.milestone.project.name, task.milestone.project.space?.name].filter(Boolean).join(" • ")
              : undefined;

            return (
              <SearchResultItem
                key={task.id}
                id={task.id}
                name={task.name}
                link={task.link}
                icon={<IconTask size={24} />}
                subtitle={subtitle}
                isSelected={isSelected}
                onClick={handleItemClick}
                testId={createTestId(state.testId, "task", task.name)}
              />
            );
          })}
        </div>
      )}

      {/* People */}
      {groupedResults.people.length > 0 && (
        <div>
          <SearchResultGroupHeader title="PEOPLE" />

          {groupedResults.people.map((person) => {
            const currentIndex = getCurrentIndex("person", person.id);
            const isSelected = currentIndex === state.selectedIndex;

            return (
              <SearchResultItem
                key={person.id}
                id={person.id}
                name={person.fullName}
                link={person.link}
                icon={<Avatar person={person} size={24} />}
                subtitle={person.title || undefined}
                isSelected={isSelected}
                onClick={handleItemClick}
                testId={createTestId(state.testId, "person", person.fullName)}
              />
            );
          })}
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

  // Results are already flat, no need to flatten them
  const flatResults = state.results;
  const hasResults = state.results.length > 0;

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle Escape key globally (in case focus is not on input)
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, hasResults, flatResults, state]);

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
        if (hasResults) {
          event.preventDefault();
          const nextDown = state.selectedIndex + 1;
          state.setSelectedIndex(nextDown >= flatResults.length ? 0 : nextDown);
        }

        break;
      case "ArrowUp":
        if (hasResults) {
          event.preventDefault();
          const nextUp = state.selectedIndex - 1;
          state.setSelectedIndex(nextUp < 0 ? flatResults.length - 1 : nextUp);
        }

        break;
      case "Enter":
        if (hasResults && state.selectedIndex >= 0 && state.selectedIndex < flatResults.length) {
          event.preventDefault();
          const selectedItem = flatResults[state.selectedIndex];
          if (selectedItem) {
            state.onNavigate(selectedItem.link);
            state.setIsOpen(false);
            state.setQuery("");
            state.setSelectedIndex(-1);
            onClose();
          }
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
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Search for projects, goals, tasks, or people..."
              className="w-full pl-10 pr-12 py-2.5 text-base bg-surface-base border-b border-surface-outline focus:outline-none rounded-b-lg"
              data-test-id={testId}
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-content-dimmed uppercase tracking-wide"
              onClick={onClose}
            >
              <IconX size={16} />
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

function SearchResultGroupHeader({ title }: { title: string }) {
  return <div className="px-3 py-0.5 text-xs font-medium text-content-dimmed">{title}</div>;
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
    state.setSelectedIndex(-1);
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
