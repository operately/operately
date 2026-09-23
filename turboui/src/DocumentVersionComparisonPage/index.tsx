import React from "react";

import { Page } from "../Page";
import type { DocumentVersion } from "../ApiTypes";
import type { FormattedTimePreferences } from "../FormattedTime";
import type { MentionedPersonLookupFn } from "../RichEditor/useEditor";
import type { ComparisonStatus, VersionSnapshot } from "../DocumentVersionHistoryPage/types";
import { ComparisonPanel } from "./ComparisonPanel";
import { DocumentVersionPageHeader } from "./DocumentVersionPageHeader";

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
  const showLegend = props.comparisonStatus === "ready" && props.before !== null && props.after !== null;

  return (
    <Page title={props.title} size="xlarge" navigation={props.navigation} testId="document-version-comparison-page">
      <div className="min-h-[75vh] px-4 py-8 sm:px-8 sm:py-10 lg:px-10">
        <DocumentVersionPageHeader title="See what changed" showLegend={showLegend} />

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
