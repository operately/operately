import React from "react";
import { PageDocsAndFilesTab } from "../DocsAndFiles/PageDocsAndFiles";
import { ContentListState } from "./ContentListState";
import type { ProjectPage } from ".";

export function DocsAndFilesSection({ state }: { state: ProjectPage.State }) {
  return (
    <div className={state.docsAndFiles ? undefined : "p-4 max-w-6xl mx-auto my-6"}>
      {!state.docsAndFiles && <h2 className="text-xl font-semibold tracking-tight mb-4">Docs & Files</h2>}
      <ContentListState
        name="docs-and-files"
        loading={state.docsAndFilesLoading}
        error={state.docsAndFilesError}
        onRetry={state.onRetryDocsAndFiles}
      >
        {state.docsAndFiles && (
          <PageDocsAndFilesTab
            docsAndFiles={state.docsAndFiles}
            formattedTimePreferences={state.formattedTimePreferences}
          />
        )}
      </ContentListState>
    </div>
  );
}
