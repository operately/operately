import * as React from "react";

import { Input } from "../Forms";
import { IconSearch, IconX } from "../icons";
import type { ResourceHubSearchProps } from "../ResourceHubPage/types";
import type { ResourceHubSearchState } from "./useResourceHubSearch";

export function ResourceHubSearchInput({
  search,
  searchState,
}: {
  search: ResourceHubSearchProps;
  searchState: ResourceHubSearchState;
}) {
  const placeholder = search.placeholder ?? "Search documents and files…";
  const testId = search.testId ?? "resource-hub-search";

  return (
    <div className="relative w-64 max-w-full shrink-0">
      <IconSearch
        size={16}
        aria-hidden="true"
        className="absolute z-10 left-3 top-1/2 -translate-y-1/2 text-content-dimmed pointer-events-none"
      />
      <Input
        type="text"
        role="searchbox"
        aria-label={placeholder}
        placeholder={placeholder}
        value={searchState.query}
        onChange={(event) => searchState.setQuery(event.target.value)}
        className="pl-9 pr-9 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-accent-base focus:border-accent-base"
        testId={testId}
      />
      {searchState.query && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => searchState.setQuery("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-content-dimmed hover:text-content-accent"
        >
          <IconX size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export function ResourceHubSearchMessage({ searchState }: { searchState: ResourceHubSearchState }) {
  if (searchState.status === "loading") {
    return <SearchMessage role="status">Searching…</SearchMessage>;
  }

  if (searchState.status === "error") {
    return <SearchMessage role="alert">Search is unavailable. Try again.</SearchMessage>;
  }

  if (searchState.status === "success" && searchState.results.length === 0) {
    return <SearchMessage role="status">No matching items. Try different keywords.</SearchMessage>;
  }

  return null;
}

function SearchMessage({ role, children }: { role: "status" | "alert"; children: React.ReactNode }) {
  return (
    <div
      role={role}
      aria-live={role === "alert" ? "assertive" : "polite"}
      className="py-12 text-center text-sm text-content-dimmed"
    >
      {children}
    </div>
  );
}
