import React from "react";

import {
  DocumentVersionComparisonPage,
  resolveSelection,
  type ComparisonStatus,
  type VersionSnapshot,
} from "turboui";

import { documents } from "@/models/resourceHubs";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { usePaths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";

import { useLoadedData } from "./loader";
import { buildDocumentVersionComparisonPageNavigation } from "./navigation";

export function Page() {
  const { document, resourceHub, versions, routeVersionNumber } = useLoadedData();
  const paths = usePaths();
  const formattedTimePreferences = useFormattedTimePreferences();
  const { mentionedPersonLookup } = useRichEditorHandlers();

  assertPresent(document.id, "document id must be present");
  assertPresent(document.permissions, "permissions must be present in document");

  const selection = React.useMemo(
    () => resolveSelection(versions, routeVersionNumber),
    [versions, routeVersionNumber],
  );

  const [before, setBefore] = React.useState<VersionSnapshot | null>(null);
  const [after, setAfter] = React.useState<VersionSnapshot | null>(null);
  const [comparisonStatus, setComparisonStatus] = React.useState<ComparisonStatus>("idle");
  const [retryToken, setRetryToken] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;

    async function loadSnapshots() {
      if (selection.after == null) {
        setBefore(null);
        setAfter(null);
        setComparisonStatus("idle");
        return;
      }

      setComparisonStatus("loading");

      try {
        const [beforeSnap, afterSnap] = await Promise.all([
          selection.before != null ? fetchSnapshot(document.id!, selection.before) : Promise.resolve(null),
          fetchSnapshot(document.id!, selection.after),
        ]);
        if (cancelled) return;

        setBefore(beforeSnap);
        setAfter(afterSnap);
        setComparisonStatus(afterSnap ? "ready" : "error");
      } catch {
        if (cancelled) return;
        setBefore(null);
        setAfter(null);
        setComparisonStatus("error");
      }
    }

    loadSnapshots();
    return () => {
      cancelled = true;
    };
  }, [document.id, selection.before, selection.after, retryToken]);

  const props: DocumentVersionComparisonPage.Props = {
    title: ["See what changed", document.name || "Document"],
    navigation: buildDocumentVersionComparisonPageNavigation(document, resourceHub, paths),
    versions,
    before,
    after,
    comparisonStatus,
    formattedTimePreferences,
    mentionedPersonLookup,
    onRetryComparison: () => setRetryToken((token) => token + 1),
  };

  return <DocumentVersionComparisonPage {...props} />;
}

async function fetchSnapshot(documentId: string, versionNumber: number): Promise<VersionSnapshot> {
  const result = await documents.getVersion({ documentId, versionNumber });
  const version = result.version!;

  return {
    versionNumber: version.versionNumber!,
    title: version.title || "",
    content: normalizeContent(version.content),
    insertedAt: version.insertedAt || undefined,
  };
}

function normalizeContent(content: unknown): unknown {
  if (typeof content === "string") {
    try {
      return JSON.parse(content);
    } catch {
      return content;
    }
  }

  return content;
}
