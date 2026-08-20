import React from "react";
import { GhostButton } from "../Button";
import { IconFlag } from "../icons";

interface EmptyStateProps {
  display: boolean;
  canEdit: boolean;
  onAdd: () => void;
}

export function EmptyState({ display, canEdit, onAdd }: EmptyStateProps) {
  if (!display) return null;

  return (
    <div className="py-8 text-center text-content-dimmed">
      <IconFlag size={48} className="mx-auto mb-4 text-content-subtle" />
      <p className="mb-1 text-sm">No milestones yet</p>
      {canEdit && (
        <div>
          <p className="mb-4 text-xs">Add milestones to track key deliverables and deadlines</p>
          <GhostButton size="sm" onClick={onAdd}>
            Add your first milestone
          </GhostButton>
        </div>
      )}
    </div>
  );
}
