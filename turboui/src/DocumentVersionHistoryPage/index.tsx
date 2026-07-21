import React from "react";

import { Page } from "../Page";
import RichContent from "../RichContent";

import type { DocumentVersionHistoryPageProps } from "./types";
import { sortVersionsNewestFirst } from "./types";
import { VersionTimeline } from "./VersionTimeline";

export namespace DocumentVersionHistoryPage {
  export type Props = DocumentVersionHistoryPageProps;
}

export {
  resolveSelection,
  sortVersionsNewestFirst,
  sortVersionsOldestFirst,
  editorLabel,
  eventActionText,
  eventDescription,
  eventActionLabel,
} from "./types";
export type { ComparisonStatus, VersionSnapshot, DocumentVersionHistoryPageProps } from "./types";

export function DocumentVersionHistoryPage(props: DocumentVersionHistoryPage.Props) {
  const versions = sortVersionsNewestFirst(props.versions);

  return (
    <Page title={props.title} size="xlarge" navigation={props.navigation} testId="document-version-history-page">
      <div className="min-h-[75vh] px-4 py-8 sm:px-10">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-content-accent md:text-4xl">History of changes</h1>
        </header>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)]">
          <section
            className="min-w-0 rounded-lg border border-surface-outline bg-surface-base p-5 sm:p-6"
            aria-label="Current document"
            data-test-id="current-document-preview"
          >
            <h2 className="text-xl font-bold text-content-accent md:text-2xl">{props.currentTitle || "Untitled"}</h2>
            <div className="mt-4 text-content-base">
              <RichContent content={props.currentContent} mentionedPersonLookup={props.mentionedPersonLookup} />
            </div>
          </section>

          <aside className="min-w-0">
            {versions.length === 0 ? (
              <div
                className="rounded-lg border border-surface-outline bg-surface-base p-6"
                data-test-id="one-version-empty"
              >
                <h2 className="text-lg font-semibold text-content-accent">No Earlier Versions</h2>
                <p className="mt-2 text-sm text-content-dimmed">
                  Changes to the title or content will appear here after the document is saved.
                </p>
              </div>
            ) : (
              <VersionTimeline
                versions={versions}
                formattedTimePreferences={props.formattedTimePreferences}
                getComparisonPath={props.getComparisonPath}
              />
            )}
          </aside>
        </div>
      </div>
    </Page>
  );
}
