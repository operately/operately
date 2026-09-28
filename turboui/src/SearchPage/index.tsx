import * as React from "react";
import { useTranslation } from "react-i18next";

import type { SearchResult, SearchResultState, SearchResultType } from "../ApiTypes";
import { Input } from "../Forms/Input";
import { FormattedTime, type FormattedTimePreferences } from "../FormattedTime";
import { tn, translationText } from "../i18n";
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
import { searchTimeFilterOptions, searchTypeFilterOptions } from "./filterOptions";
import { RefineControls, type RefineControlsProps } from "./RefineControls";

export { searchTimeFilterOptions, searchTypeFilterOptions };

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
    formattedTimePreferences: FormattedTimePreferences;
    refine?: Refine;
  }
}

const RESULT_LIMIT = 30;

export function SearchPage({
  query,
  status,
  results,
  onQueryChange,
  formattedTimePreferences,
  refine,
}: SearchPage.Props) {
  const { t } = useTranslation();
  const visibleResults = results.slice(0, RESULT_LIMIT);

  return (
    <Page title={translationText(t("Search"))} size="large" testId="company-search-page">
      <main className="min-h-[75vh] px-4 py-8 sm:px-12 sm:py-10">
        <h1 className="sr-only">{t("Search")}</h1>
        {refine ? (
          <div className="sticky top-0 z-10 -mx-4 border-b border-surface-outline bg-surface-base px-4 pb-4 pt-1 sm:-mx-12 sm:px-12">
            <SearchField query={query} onQueryChange={onQueryChange} />
            <RefineControls {...refine} />
          </div>
        ) : (
          <SearchField query={query} onQueryChange={onQueryChange} />
        )}
        <div className="mt-8">
          <SearchContent
            query={query}
            status={status}
            results={visibleResults}
            formattedTimePreferences={formattedTimePreferences}
          />
        </div>
      </main>
    </Page>
  );
}

function SearchField({ query, onQueryChange }: Pick<SearchPage.Props, "query" | "onQueryChange">) {
  const { t } = useTranslation();

  return (
    <div className="relative">
      <label className="sr-only" htmlFor="company-search-input">
        {t("Search titles and content…")}
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
        placeholder={translationText(t("Search titles and content…"))}
        className="py-3 pl-12 pr-4 text-base sm:text-lg"
      />
    </div>
  );
}

function SearchContent({
  query,
  status,
  results,
  formattedTimePreferences,
}: Pick<SearchPage.Props, "query" | "status" | "results" | "formattedTimePreferences">) {
  const { t } = useTranslation();

  if (status === "loading") {
    return <SearchMessage role="status">{t("Searching…")}</SearchMessage>;
  }

  if (status === "error") {
    return <SearchMessage role="alert">{t("Search is unavailable. Try again.")}</SearchMessage>;
  }

  if (status === "initial") {
    return (
      <SearchMessage role="status">{t("Search across projects, goals, discussions, documents, and more.")}</SearchMessage>
    );
  }

  if (results.length === 0) {
    return (
      <SearchMessage role="status">
        {t("No content found for “{{query}}”. Try different keywords.", { query })}
      </SearchMessage>
    );
  }

  return (
    <>
      <p role="status" className="sr-only">
        {tn("1 result found.", "{{count}} results found.", results.length)}
      </p>
      <ol aria-label={translationText(t("Search results"))} className="divide-y divide-surface-outline">
        {results.map((result) => (
          <li key={`${result.type}-${result.id}`}>
            <SearchResultRow
              query={query}
              result={result}
              formattedTimePreferences={formattedTimePreferences}
            />
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

function SearchResultRow({
  query,
  result,
  formattedTimePreferences,
}: {
  query: string;
  result: SearchPage.Result;
  formattedTimePreferences: FormattedTimePreferences;
}) {
  const { t } = useTranslation();
  const metadata = resultTypeLabel(result.type, t);
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
              customLabel={stateLabel(result.state, t)}
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
      {result.insertedAt ? (
        <span
          data-test-id="search-result-inserted-at"
          className="mt-1 shrink-0 whitespace-nowrap text-xs text-content-subtle"
        >
          <FormattedTime {...formattedTimePreferences} time={result.insertedAt} format="relative-time-or-date" />
        </span>
      ) : null}
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

function resultTypeLabel(type: SearchResultType, t: (key: string) => string) {
  switch (type) {
    case "resource_hub_folder":
      return { label: t("Folder") };
    case "resource_hub_document":
      return { label: t("Document") };
    case "resource_hub_file":
      return { label: t("File") };
    case "resource_hub_link":
      return { label: t("Link") };
    case "project":
      return { label: t("Project") };
    case "goal":
      return { label: t("Goal") };
    case "milestone":
      return { label: t("Milestone") };
    case "task":
      return { label: t("Task") };
    case "person":
      return { label: t("Person") };
    case "discussion":
      return { label: t("Discussion") };
    case "project_check_in":
      return { label: t("Project check-in") };
    case "goal_check_in":
      return { label: t("Goal check-in") };
    case "project_retrospective":
      return { label: t("Project retrospective") };
  }
}

function stateLabel(state: SearchResultState, t: (key: string) => string) {
  switch (state) {
    case "closed":
      return t("Closed");
    case "completed":
      return t("Completed");
    case "archived":
      return t("Archived");
    case "paused":
      return t("Paused");
  }
}
