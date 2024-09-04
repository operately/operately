import * as React from "react";
import * as Projects from "@/models/projects";

import { Paths } from "@/routes/paths";
import { GhostButton } from "@/components/Button";

import ContributorAvatar from "@/components/ContributorAvatar";

export function ContributorsSection({ project }: { project: Projects.Project }) {
  const contribs = Projects.sortContributorsByRole(project.contributors!);

  return (
    <div className="flex items-center gap-1">
      {contribs!.map((c) => (
        <ContributorAvatar key={c.id} contributor={c} />
      ))}

      <ManageAccessButton project={project} />
    </div>
  );
}

function ManageAccessButton({ project }: { project: Projects.Project }) {
  if (!project.permissions!.canEditContributors) return null;
  const path = Paths.projectContributorsPath(project.id!);

  return (
    <div className="ml-2">
      <GhostButton size="xs" type="secondary" testId="manage-team-button" linkTo={path}>
        Manage Team &amp; Access
      </GhostButton>
    </div>
  );
}
