import * as React from "react";
import { Link } from "../Link";
import type { ResourceHubDraftNode } from "./types";

interface ContinueEditingDraftsProps {
  drafts: ResourceHubDraftNode[];
  draftsPath: string;
}

export function ContinueEditingDrafts({ drafts, draftsPath }: ContinueEditingDraftsProps) {
  if (drafts.length < 1) return null;

  const firstDraft = drafts[0];
  const path = drafts.length === 1 && firstDraft ? firstDraft.editPath || firstDraft.path : draftsPath;
  const label = drafts.length === 1 ? "Continue writing your draft document…" : `Continue writing your ${drafts.length} draft documents…`;

  return (
    <div className="flex justify-center">
      <Link className="font-medium" to={path} testId="continue-editing-draft">
        {label}
      </Link>
    </div>
  );
}
