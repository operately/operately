import React from "react";

import { StatusSelector } from "../StatusSelector";
import { buildStatus } from "./utils";

export function useDraftStatuses(source: ReadonlyArray<StatusSelector.StatusOption>, isOpen: boolean) {
  const createDraft = React.useCallback(
    () =>
      (source.length > 0 ? source : [buildStatus(undefined, 0, true)]).map((status, index) =>
        buildStatus(status, index, false),
      ),
    [source],
  );

  const [drafts, setDrafts] = React.useState<StatusSelector.StatusOption[]>(createDraft);

  React.useEffect(() => {
    if (isOpen) {
      setDrafts(createDraft());
    }
  }, [createDraft, isOpen]);

  return [drafts, setDrafts] as const;
}

export function useStatusSaving(
  draftStatuses: ReadonlyArray<StatusSelector.StatusOption>,
  deletedStatuses: ReadonlyArray<StatusSelector.StatusOption>,
  deletedStatusReplacements: Record<string, string>,
  onSave: (data: {
    nextStatuses: StatusSelector.StatusOption[];
    deletedStatusReplacements: Record<string, string>;
  }) => void,
  isOpen: boolean,
  requireReplacement: boolean = false,
) {
  const [showValidation, setShowValidation] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setShowValidation(false);
    }
  }, [isOpen]);

  const sanitizedStatuses = React.useMemo(
    () => draftStatuses.map((status) => ({ ...status, label: status.label.trim() })),
    [draftStatuses],
  );

  const hasEmptyLabel = sanitizedStatuses.some((status) => status.label.length === 0);

  const nextStatusIds = React.useMemo(() => new Set(sanitizedStatuses.map((s) => s.id)), [sanitizedStatuses]);

  const deletedMissingReplacement = React.useMemo(() => {
    if (!requireReplacement) return false;
    if (deletedStatuses.length === 0) return false;

    return deletedStatuses.some((deletedStatus) => {
      const replacementId = deletedStatusReplacements[deletedStatus.id];
      if (!replacementId) return true;
      return !nextStatusIds.has(replacementId);
    });
  }, [requireReplacement, deletedStatuses, deletedStatusReplacements, nextStatusIds]);

  const handleSave = () => {
    if (hasEmptyLabel || deletedMissingReplacement) {
      setShowValidation(true);
      return;
    }

    const replacementsToSave = requireReplacement
      ? deletedStatuses.reduce<Record<string, string>>((acc, deletedStatus) => {
          const replacementId = deletedStatusReplacements[deletedStatus.id];
          if (replacementId && nextStatusIds.has(replacementId)) {
            acc[deletedStatus.id] = replacementId;
          }
          return acc;
        }, {})
      : {};

    onSave({ nextStatuses: sanitizedStatuses, deletedStatusReplacements: replacementsToSave });
  };

  return { sanitizedStatuses, showValidation, handleSave };
}
