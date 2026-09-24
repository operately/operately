import * as React from "react";
import { useTranslation } from "react-i18next";

import { SearchActivator } from "./SearchActivator";
import { translationText } from "../i18n";
import { SearchOverlay } from "./SearchOverlay";

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
    fullTextSearchPath?: (query: string) => string;
    placeholder?: string;
    testId?: string;
  }

  export interface State {
    search: SearchFn;
    onNavigate: (link: string) => void;
    fullTextSearchPath?: (query: string) => string;
    placeholder: string;
    testId: string;

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

function useGlobalSearchState(props: GlobalSearch.Props): GlobalSearch.State {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<GlobalSearch.SearchResult>({});
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchError, setSearchError] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(-1);

  const requestSequence = React.useRef(0);
  const searchTimeoutRef = React.useRef<ReturnType<typeof setTimeout>>();

  const performSearch = React.useCallback(
    async (searchQuery: string, requestId: number) => {
      if (searchQuery.trim().length < 2) {
        setResults({});
        setIsSearching(false);
        setSearchError(false);
        setSelectedIndex(-1);
        setIsOpen(false);
        return;
      }

      setIsSearching(true);
      setSearchError(false);

      try {
        const searchResults = await props.search({ query: searchQuery.trim() });
        if (requestSequence.current !== requestId) return;
        setResults(searchResults);
        setSelectedIndex(-1);
        setIsOpen(true);
      } catch {
        if (requestSequence.current !== requestId) return;
        setResults({});
        setSearchError(true);
        setSelectedIndex(-1);
      } finally {
        if (requestSequence.current === requestId) setIsSearching(false);
      }
    },
    [props.search],
  );

  React.useEffect(() => {
    const requestId = ++requestSequence.current;
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query, requestId);
    }, 300);

    return () => {
      requestSequence.current += 1;
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, performSearch]);

  return {
    ...props,
    placeholder: props.placeholder ?? "",
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

export function GlobalSearch(props: GlobalSearch.Props) {
  const { t } = useTranslation();
  const state = useGlobalSearchState({ ...props, placeholder: props.placeholder ?? translationText(t("Search...")) });
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
