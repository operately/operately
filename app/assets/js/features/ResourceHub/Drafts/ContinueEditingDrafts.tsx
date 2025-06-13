import React from "react";

import { ResourceHubNode } from "@/models/resourceHubs";
import { Link } from "turboui";

import { usePaths } from "@/routes/paths";
interface Props {
  resourceHubId: string;
  drafts: ResourceHubNode[];
}

export function ContinueEditingDrafts({ resourceHubId, drafts }: Props) {
  if (drafts.length < 1) {
    return null;
  } else if (drafts.length === 1) {
    const path = paths.resourceHubEditDocumentPath(drafts[0]?.document?.id!);

    return (
      <div className="flex justify-center">
        <Link className="font-medium" to={path} testId="continue-editing-draft">
          Continue writing your draft document&hellip;
        </Link>
      </div>
    );
  } else {
    const path = paths.resourceHubDraftsPath(resourceHubId);

    return (
      <div className="flex justify-center">
        <Link className="font-medium" to={path} testId="continue-editing-draft">
          Continue writing your {drafts.length} draft documents&hellip;
        </Link>
      </div>
    );
  }
}
