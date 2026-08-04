import * as React from "react";

import type { SearchResult, SearchResultState, SearchResultType } from "../ApiTypes";
import { Input } from "../Forms/Input";
import {
  IconCalendar,
  IconGoal,
  IconHistory,
  IconMilestone,
  IconMessage,
  IconProject,
  IconSearch,
  IconTask,
  IconUser,
} from "../icons";
import { DivLink } from "../Link";
import { Page } from "../Page";
import { ResourceHubTypeIcon } from "../ResourceHub";
import { StatusBadge } from "../StatusBadge";
import { RefineControls, type RefineControlsProps } from "./RefineControls";

export namespace SearchPage {
  export type Status = "initial" | "loading" | "success" | "error";
  export type Result = SearchResult & { link: string };
  export type Refine = RefineControlsProps;
  export type SortMode = RefineControlsProps["sort"];
  export type RefineFilter = RefineControlsProps["filters"][number];

  export interface Props {
    query: string;
    status: Status;
    results: Result[];
    onQueryChange: (query: string) => void;
    refine?: Refine;
  }
}

const RESULT_LIMIT = 30;

export function SearchPage({ query, status, results, onQueryChange, refine }: SearchPage.Props) {
  const visibleResults = results.slice(0, RESULT_LIMIT);

  return (
    <Page title="Search" size="large" testId="company-search-page">
      <main className="min-h-[75vh] px-4 py-8 sm:px-12 sm:py-10">
        <h1 className="sr-only">Search</h1>
        {refine ? (
          <div className="sticky top-0 z-10 -mx-4 border-b border-surface-outline bg-surface-base px-4 pb-4 pt-1 sm:-mx-12 sm:px-12">
            <SearchField query={query} onQueryChange={onQueryChange} />
            <RefineControls {...refine} />
          </div>
        ) : (
          <SearchField query={query} onQueryChange={onQueryChange} />
        )}
        <div className="mt-8">
          <SearchContent query={query} status={status} results={visibleResults} />
        </div>
      </main>
    </Page>
  );
}

function SearchField({ query, onQueryChange }: Pick<SearchPage.Props, "query" | "onQueryChange">) {
  return (
    <div className="relative">
      <label className="sr-only" htmlFor="company-search-input">
        Search titles and content…
      </label>
      <IconSearch
        aria-hidden="true"
        size={22}
        className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-content-subtle"
      />
      <Input
        id="company-search-input"
        testId="company-search-input"
        type="search"
        autoFocus
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Search titles and content…"
        className="py-3 pl-12 pr-4 text-base sm:text-lg"
      />
    </div>
  );
}

function SearchContent({ query, status, results }: Pick<SearchPage.Props, "query" | "status" | "results">) {
  if (status === "loading") {
    return <SearchMessage role="status">Searching…</SearchMessage>;
  }

  if (status === "error") {
    return <SearchMessage role="alert">Search is unavailable. Try again.</SearchMessage>;
  }

  if (status === "initial") {
    return (
      <SearchMessage role="status">Search across projects, goals, discussions, documents, and more.</SearchMessage>
    );
  }

  if (results.length === 0) {
    return <SearchMessage role="status">No content found for “{query}”. Try different keywords.</SearchMessage>;
  }

  return (
    <>
      <p role="status" className="sr-only">
        {resultCountLabel(results.length)}
      </p>
      <ol aria-label="Search results" className="divide-y divide-surface-outline">
        {results.map((result) => (
          <li key={`${result.type}-${result.id}`}>
            <SearchResultRow query={query} result={result} />
          </li>
        ))}
      </ol>
    </>
  );
}

function SearchMessage({ role, children }: { role: "status" | "alert"; children: React.ReactNode }) {
  return (
    <p role={role} className="py-16 text-center text-sm text-content-dimmed sm:text-base">
      {children}
    </p>
  );
}

function SearchResultRow({ query, result }: { query: string; result: SearchPage.Result }) {
  const metadata = RESULT_TYPE_METADATA[result.type];
  const highlightTerms = getHighlightTerms(query);

  return (
    <DivLink
      to={result.link}
      testId="company-search-result"
      className="group flex items-start gap-3 rounded-lg px-2 py-5 transition-colors hover:bg-surface-highlight sm:gap-4 sm:px-3"
    >
      <div
        aria-hidden="true"
        data-testid="search-result-icon"
        className="mt-0.5 flex h-12 w-12 shrink-0 self-start items-center justify-center"
      >
        <SearchResultIcon type={result.type} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-content-dimmed">{metadata.label}</span>
          <span aria-hidden="true" className="text-xs text-content-subtle">
            ·
          </span>
          <span className="min-w-0 truncate text-xs font-medium text-content-dimmed">{result.context}</span>
          {result.state ? (
            <StatusBadge
              status={result.state}
              customLabel={STATE_LABELS[result.state]}
              hideIcon
              className="shrink-0"
            />
          ) : null}
        </div>
        <h2 className="mt-1 min-w-0 break-words text-base font-semibold text-content-accent">
          <HighlightedText text={result.title} terms={highlightTerms} />
        </h2>
        {result.snippet ? (
          <p
            data-testid="search-result-snippet"
            className="mt-1 line-clamp-3 break-words text-sm leading-6 text-content-base"
          >
            <HighlightedText text={result.snippet} terms={highlightTerms} />
          </p>
        ) : null}
      </div>
    </DivLink>
  );
}

function SearchResultIcon({ type }: { type: SearchResultType }) {
  switch (type) {
    case "resource_hub_folder":
      return <ResourceHubTypeIcon type="folder" size={48} />;
    case "resource_hub_document":
      return <ResourceHubTypeIcon type="document" size={48} />;
    case "resource_hub_file":
      return <ResourceHubTypeIcon type="file" size={48} />;
    case "resource_hub_link":
      return <ResourceHubTypeIcon type="link" size={48} />;
    case "project":
      return <IconProject size={32} />;
    case "goal":
      return <IconGoal size={32} />;
    case "milestone":
      return <IconMilestone size={32} />;
    case "task":
      return <IconTask size={32} />;
    case "person":
      return <IconUser size={28} className="text-content-dimmed" />;
    case "discussion":
      return <IconMessage size={28} className="text-content-dimmed" />;
    case "project_check_in":
    case "goal_check_in":
      return <IconCalendar size={28} className="text-content-dimmed" />;
    case "project_retrospective":
      return <IconHistory size={28} className="text-content-dimmed" />;
  }
}

function HighlightedText({ text, terms }: { text: string; terms: string[] }) {
  if (terms.length === 0) return <>{text}</>;

  const alternatives = terms.map(escapeRegExp).join("|");
  const segments = text.split(new RegExp(`(${alternatives})`, "giu"));
  const exactMatch = new RegExp(`^(?:${alternatives})$`, "iu");

  return (
    <>
      {segments.map((segment, index) =>
        exactMatch.test(segment) ? (
          <mark
            key={`${segment}-${index}`}
            className="rounded-sm bg-yellow-200/80 px-0.5 text-inherit dark:bg-yellow-700/60"
          >
            {segment}
          </mark>
        ) : (
          segment
        ),
      )}
    </>
  );
}

function getHighlightTerms(query: string) {
  const words = query.split(/[^\p{L}\p{N}]+/u);
  const uniqueWords = new Map<string, string>();

  words.forEach((word) => {
    if (word.length > 1) uniqueWords.set(word.toLowerCase(), word);
  });

  return Array.from(uniqueWords.values()).sort((left, right) => right.length - left.length);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function resultCountLabel(count: number) {
  return count === 1 ? "1 result found." : `${count} results found.`;
}

const RESULT_TYPE_METADATA: Record<SearchResultType, { label: string }> = {
  resource_hub_folder: { label: "Folder" },
  resource_hub_document: { label: "Document" },
  resource_hub_file: { label: "File" },
  resource_hub_link: { label: "Link" },
  project: { label: "Project" },
  goal: { label: "Goal" },
  milestone: { label: "Milestone" },
  task: { label: "Task" },
  person: { label: "Person" },
  discussion: { label: "Discussion" },
  project_check_in: { label: "Project check-in" },
  goal_check_in: { label: "Goal check-in" },
  project_retrospective: { label: "Project retrospective" },
};

const STATE_LABELS: Record<SearchResultState, string> = {
  closed: "Closed",
  completed: "Completed",
  archived: "Archived",
  paused: "Paused",
};
