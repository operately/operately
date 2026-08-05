import * as React from "react";

import * as People from "@/models/people";

import { MarkdownHintsPreference } from "turboui";
import { useMe } from "@/contexts/CurrentCompanyContext";

//
// Exposes the current person's server-persisted "markdown shortcuts" hint
// preference and a toggle that persists the change. Reads the logged-in person
// from CurrentCompanyContext (the app's existing "current person" source) so it
// doesn't need to be prop-drilled through every RichEditor consumer.
//
// Returns undefined when there is no current person (e.g. public pages), which
// simply hides the toolbar toggle.
//
export function useMarkdownHintsPreference(): MarkdownHintsPreference | undefined {
  const me = useMe();
  const persisted = me?.markdownHints ?? true;

  const [enabled, setEnabled] = React.useState(persisted);

  // Keep local state in sync with the persisted value so reloads and other
  // sessions reflect the server preference rather than a local-only toggle.
  React.useEffect(() => {
    setEnabled(persisted);
  }, [persisted]);

  const onToggle = React.useCallback(() => {
    if (!me) return;

    const next = !enabled;
    setEnabled(next); // optimistic; CurrentCompanyContext refetches "me" on profile_updated

    People.updateProfile({ id: me.id, markdownHints: next }).catch(() => setEnabled(!next));
  }, [me, enabled]);

  if (!me) return undefined;

  return { enabled, onToggle };
}
