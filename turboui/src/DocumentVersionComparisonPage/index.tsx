import React from "react";

import { Page } from "../Page";
import type { DocumentVersion } from "../ApiTypes";
import type { FormattedTimePreferences } from "../FormattedTime";
import type { MentionedPersonLookupFn } from "../RichEditor/useEditor";
import type { ComparisonStatus, VersionSnapshot } from "../DocumentVersionHistoryPage/types";
import { DiffLegend } from "../RichContentDiff";

import { ComparisonPanel } from "./ComparisonPanel";

export namespace DocumentVersionComparisonPage {
  export type Props = {
    title: Page.Props["title"];
    navigation: NonNullable<Page.Props["navigation"]>;
    versions: DocumentVersion[];
    before: VersionSnapshot | null;
    after: VersionSnapshot | null;
    comparisonStatus: ComparisonStatus;
    formattedTimePreferences: FormattedTimePreferences;
    mentionedPersonLookup: MentionedPersonLookupFn;
    onRetryComparison: () => void;
  };
}

export type { ComparisonStatus, VersionSnapshot };

export function DocumentVersionComparisonPage(props: DocumentVersionComparisonPage.Props) {
  return (
    <Page title={props.title} size="xlarge" navigation={props.navigation} testId="document-version-comparison-page">
      <div className="min-h-[75vh] px-4 py-8 sm:px-10">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-content-accent md:text-4xl">See what changed</h1>
          <DiffLegend className="mt-3" />
        </header>

        <ComparisonPanel
          versions={props.versions}
          before={props.before}
          after={props.after}
          comparisonStatus={props.comparisonStatus}
          formattedTimePreferences={props.formattedTimePreferences}
          mentionedPersonLookup={props.mentionedPersonLookup}
          onRetryComparison={props.onRetryComparison}
        />
      </div>
    </Page>
  );
}
