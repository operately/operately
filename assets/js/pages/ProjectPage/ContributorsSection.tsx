import * as React from "react";
import * as Projects from "@/models/projects";
import * as ProjectContributors from "@/models/projectContributors";

import { Paths } from "@/routes/paths";
import { GhostButton } from "@/components/Buttons";
import { ContributorAvatar, ReviewerPlaceholder, ChampionPlaceholder } from "@/components/ContributorAvatar";
import { ProjectContributor } from "@/models/projectContributors";

export function ContributorsSection({ project }: { project: Projects.Project }) {
  const { champion, reviewer, contributors } = ProjectContributors.splitByRole(project.contributors!);

  return (
    <div className="flex items-center gap-1">
      <Champion champion={champion} project={project} />
      <Reviewer reviewer={reviewer} project={project} />
      <ContribList contributors={contributors} />
      <ManageAccessButton project={project} />
    </div>
  );
}

function Champion({ project, champion }: { project: Projects.Project; champion: ProjectContributor }) {
  return champion ? <ContributorAvatar contributor={champion} /> : <ChampionPlaceholder project={project} />;
}

function Reviewer({ project, reviewer }: { project: Projects.Project; reviewer: ProjectContributor }) {
  return reviewer ? <ContributorAvatar contributor={reviewer} /> : <ReviewerPlaceholder project={project} />;
}

function ContribList({ contributors }: { contributors: ProjectContributor[] }) {
  return contributors!.map((c) => <ContributorAvatar key={c.id} contributor={c} />);
}

function ManageAccessButton({ project }: { project: Projects.Project }) {
  if (!project.permissions!.canEditContributors) return null;
  const path = Paths.projectContributorsPath(project.id!);

  return (
    <div className="ml-2">
      <GhostButton size="xs" type="secondary" testId="manage-team-button" linkTo={path}>
        Manage team &amp; access
      </GhostButton>
    </div>
  );
}
