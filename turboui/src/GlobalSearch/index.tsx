import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import classNames from "../utils/classnames";
import { IconSearch, IconHome2, IconBriefcase, IconGoal, IconCheck, IconUser } from "../icons";
import { createTestId } from "../TestableElement";
import { DivLink } from "../Link";

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

  const performSearch = React.useCallback(async (searchQuery: string) => {
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
  }, [props.search]);

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
    placeholder: props.placeholder ?? "Search projects, goals, tasks, people...",
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

function SearchInput({ state }: { state: GlobalSearch.State }) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
      if (event.key === "Escape") {
        state.setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [state.setIsOpen]);

  return (
    <Popover.Trigger asChild>
      <div className="relative">
        <div className="relative">
          <IconSearch 
            size={16} 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-content-dimmed pointer-events-none" 
          />
          <input
            ref={inputRef}
            type="text"
            value={state.query}
            onChange={(e) => state.setQuery(e.target.value)}
            placeholder={state.placeholder}
            className={classNames(
              "w-full pl-9 pr-16 py-2 text-sm",
              "bg-surface-base border border-surface-outline rounded-lg",
              "focus:outline-none focus:ring-1 focus:ring-accent-base focus:border-accent-base",
              "placeholder:text-content-dimmed"
            )}
            data-test-id={state.testId}
            onFocus={() => state.query.length >= 2 && setImmediate(() => state.setIsOpen(true))}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-content-dimmed pointer-events-none">
            ⌘K
          </div>
        </div>
      </div>
    </Popover.Trigger>
  );
}

function SearchResults({ state }: { state: GlobalSearch.State }) {
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
    return (
      <div className="p-4 text-center text-content-dimmed text-sm">
        Searching...
      </div>
    );
  }

  if (!hasResults && state.query.length >= 2) {
    return (
      <div className="p-4 text-center text-content-dimmed text-sm">
        No results found for "{state.query}"
      </div>
    );
  }

  if (!hasResults) {
    return null;
  }

  const handleItemClick = (link: string) => {
    state.onNavigate(link);
    state.setIsOpen(false);
    state.setQuery("");
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
                  {person.title && (
                    <div className="text-xs text-content-dimmed truncate">{person.title}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function GlobalSearch(props: GlobalSearch.Props) {
  const state = useGlobalSearchState(props);

  return (
    <Popover.Root open={state.isOpen} onOpenChange={state.setIsOpen}>
      <SearchInput state={state} />
      
      <Popover.Portal>
        <Popover.Content
          className="bg-surface-base shadow-lg rounded-lg border border-stroke-base max-w-md w-96 max-h-96 overflow-y-auto z-50"
          sideOffset={4}
          alignOffset={0}
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <SearchResults state={state} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
