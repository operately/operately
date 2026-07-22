import React from "react";

import { DocumentVersionHistoryPage } from "turboui";

import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { usePaths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";

import { useLoadedData } from "./loader";
import { buildDocumentVersionsPageNavigation } from "./navigation";

export function Page() {
  const { document, resourceHub, versions } = useLoadedData();
  const paths = usePaths();
  const formattedTimePreferences = useFormattedTimePreferences();
  const { mentionedPersonLookup } = useRichEditorHandlers();

  assertPresent(document.id, "document id must be present");
  assertPresent(document.permissions, "permissions must be present in document");

  const props: DocumentVersionHistoryPage.Props = {
    title: ["History of changes", document.name || "Document"],
    navigation: buildDocumentVersionsPageNavigation(document, resourceHub, paths),
    currentTitle: document.name || "Untitled",
    currentContent: normalizeContent(document.content),
    versions,
    formattedTimePreferences,
    mentionedPersonLookup,
    getComparisonPath: (versionNumber) => paths.resourceHubDocumentVersionPath(document.id!, versionNumber),
  };

  return <DocumentVersionHistoryPage {...props} />;
}

function normalizeContent(content: unknown): unknown {
  if (typeof content === "string") {
    try {
      return JSON.parse(content);
    } catch {
      return content;
    }
  }

  return content ?? { type: "doc", content: [] };
}
