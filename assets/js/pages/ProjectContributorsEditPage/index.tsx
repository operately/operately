import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { ProjectContribsSubpageNavigation } from "@/components/ProjectPageNavigation";
import { match } from "ts-pattern";

import { ReassignAsContributor } from "./ReassignAsContributor";
import { EditContributor } from "./EditContributor";

export { loader, UrlParams } from "./loader";

export function Page() {
  const { contributor, action } = Pages.useLoadedData();

  return (
    <Paper.Root size="small">
      <ProjectContribsSubpageNavigation project={contributor.project} />

      {match(action)
        .with("edit-contributor", () => <EditContributor />)
        // .with("change-champion", () => <ChangeChampion />)
        // .with("change-reviewer", () => <ChangeReviewer />)
        .with("reassign-as-contributor", () => <ReassignAsContributor />)
        .run()}
    </Paper.Root>
  );
}
