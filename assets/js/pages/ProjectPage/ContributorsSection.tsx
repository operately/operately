import * as React from "react";
import * as Projects from "@/models/projects";

import { DivLink } from "@/components/Link";
import { Paths } from "@/routes/paths";
import { GhostButton } from "@/components/Button";

import ContributorAvatar from "@/components/ContributorAvatar";

export function ContributorsSection({ project }: { project: Projects.Project }) {
  const contributorsPath = Paths.projectContributorsPath(project.id!);
  const contribs = Projects.sortContributorsByRole(project.contributors!);

  return (
    <DivLink to={contributorsPath} testId="project-contributors" className="flex items-center gap-1 cursor-pointer">
      {contribs!.map((c) => (
        <ContributorAvatar key={c.id} contributor={c} />
      ))}

      <ManageAccessButton project={project} />
    </DivLink>
  );
}

function ManageAccessButton({ project }: { project: Projects.Project }) {
  if (!project.permissions!.canEditContributors) return null;

  return (
    <div className="ml-2">
      <GhostButton size="xs" type="secondary" testId="manage-team-button">
        Manage Team &amp; Access
      </GhostButton>
    </div>
  );
}
