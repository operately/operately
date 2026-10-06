import * as React from "react";
import { useTranslation } from "react-i18next";
import { tn } from "../i18n";
import { Link } from "../Link";
import type { ResourceHubNode } from "./types";

export interface ContinueEditingDraftsProps {
  drafts: ResourceHubNode[];
  draftsPath: string;
}

export function ContinueEditingDrafts({ drafts, draftsPath }: ContinueEditingDraftsProps) {
  useTranslation();

  if (drafts.length === 0) return null;

  return (
    <div className="flex justify-center -mt-2 mb-5">
      <Link className="font-medium" to={draftsPath} testId="continue-editing-draft">
        {tn("Your drafts ({{count}})", "Your drafts ({{count}})", drafts.length)}
      </Link>
    </div>
  );
}
