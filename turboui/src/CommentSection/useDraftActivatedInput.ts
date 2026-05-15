import React from "react";
import { hasLocalDraft } from "../RichEditor";

export function useDraftActivatedInput(commentDraftKey?: string) {
  const [active, setActive] = React.useState(() => hasLocalDraft({ key: commentDraftKey }, undefined));

  const activate = React.useCallback(() => setActive(true), []);
  const deactivate = React.useCallback(() => setActive(false), []);

  React.useEffect(() => {
    if (active) return;
    if (!hasLocalDraft({ key: commentDraftKey }, undefined)) return;

    setActive(true);
  }, [active, commentDraftKey]);

  return { active, activate, deactivate };
}
