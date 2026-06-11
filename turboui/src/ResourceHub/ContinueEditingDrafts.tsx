import * as React from "react";
import { Link } from "../Link";
import type { ResourceHubNode } from "./types";

interface ContinueEditingDraftsProps {
  drafts: ResourceHubNode[];
  draftsPath: string;
  getDraftEditPath: (node: ResourceHubNode) => string | undefined;
  getNodePath: (node: ResourceHubNode) => string;
}

export function ContinueEditingDrafts({ drafts, draftsPath, getDraftEditPath, getNodePath }: ContinueEditingDraftsProps) {
  if (drafts.length < 1) return null;

  const firstDraft = drafts[0];
  const path = drafts.length === 1 && firstDraft ? getDraftEditPath(firstDraft) || getNodePath(firstDraft) : draftsPath;
  const label = drafts.length === 1 ? "Continue writing your draft document…" : `Continue writing your ${drafts.length} draft documents…`;

  return (
    <div className="flex justify-center">
      <Link className="font-medium" to={path} testId="continue-editing-draft">
        {label}
      </Link>
    </div>
  );
}
