import * as React from "react";
import * as Projects from "@/models/projects";
import * as ProjectContributors from "@/models/projectContributors";

import { Paths } from "@/routes/paths";
import { SecondaryButton } from "@/components/Buttons";
import { ContributorAvatar, ReviewerPlaceholder, ChampionPlaceholder } from "@/components/ContributorAvatar";
import { ProjectContributor } from "@/models/projectContributors";

export function ContributorsSection({ project }: { project: Projects.Project }) {
  const { champion, reviewer, contributors } = ProjectContributors.splitByRole(project.contributors!);

  return (
    <div className="flex items-center gap-1 flex-wrap">
      <Champion champion={champion} project={project} />
      <Reviewer reviewer={reviewer} project={project} />
      <ContribList contributors={contributors} />
      <SmallGap />
      <ManageAccessButton project={project} />
    </div>
  );
}

function Champion({ project, champion }: { project: Projects.Project; champion: ProjectContributor }) {
  return champion ? <ContributorAvatar contributor={champion} /> : <ChampionPlaceholder project={project} size="lg" />;
}

function Reviewer({ project, reviewer }: { project: Projects.Project; reviewer: ProjectContributor }) {
  return reviewer ? <ContributorAvatar contributor={reviewer} /> : <ReviewerPlaceholder project={project} size="lg" />;
}

function ContribList({ contributors }: { contributors: ProjectContributor[] }) {
  return contributors!.map((c) => <ContributorAvatar key={c.id} contributor={c} />);
}

function ManageAccessButton({ project }: { project: Projects.Project }) {
  if (!project.permissions!.canEditContributors) return null;
  const path = Paths.projectContributorsPath(project.id!);

  return (
    <SecondaryButton size="xs" testId="manage-team-button" linkTo={path}>
      Manage team &amp; access
    </SecondaryButton>
  );
}

//
// To look good, we need to add a small gap between the contributors and the manage team button
// This is a small component that adds a small gap. Originally, we would have to add a margin-left
// to the manage team button, but this is a better approach as it plays well with the flex layout
// and the wrapping of the contributors.
//
function SmallGap() {
  return <div className="ml-0.5" />;
}
