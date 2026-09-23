import React from "react";

import { DocumentVersionComparisonPage, resolveSelection } from "turboui";

import { useVersionComparison } from "./useVersionComparison";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { usePaths } from "@/routes/paths";

import { useLoadedData } from "./loader";
import { buildDocumentVersionComparisonPageNavigation } from "./navigation";

export function Page() {
  const { document, resourceHub, versions, routeVersionNumber } = useLoadedData();
  const paths = usePaths();
  const formattedTimePreferences = useFormattedTimePreferences();
  const { mentionedPersonLookup, resolveResourceLinkTitles } = useRichEditorHandlers();

  const selection = React.useMemo(() => resolveSelection(versions, routeVersionNumber), [versions, routeVersionNumber]);

  const comparison = useVersionComparison(document.id, selection.before, selection.after);

  const props: DocumentVersionComparisonPage.Props = {
    title: ["See what changed", document.name || "Document"],
    navigation: buildDocumentVersionComparisonPageNavigation(document, resourceHub, paths),
    versions,
    ...comparison,
    formattedTimePreferences,
    mentionedPersonLookup,
    resolveResourceLinkTitles,
  };

  return <DocumentVersionComparisonPage {...props} />;
}
