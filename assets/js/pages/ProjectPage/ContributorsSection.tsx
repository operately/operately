import * as React from "react";
import * as Projects from "@/models/projects";
import * as ProjectContributors from "@/models/projectContributors";

import { Paths } from "@/routes/paths";
import { SecondaryButton } from "@/components/Buttons";
import { ContributorAvatar, ReviewerPlaceholder, ChampionPlaceholder } from "@/components/ContributorAvatar";
import { ProjectContributor } from "@/models/projectContributors";

export function ContributorsSection({ project }: { project: Projects.Project }) {
  const { champion, reviewer, contributors } = ProjectContributors.splitByRole(project.contributors!);

  //
  // A note about why we need two flex containers here:
  // To look good, the button needs to be a bit more separated from the avatars.
  //
  // Originally, I simply applied a margin-left to the button, but when the avatars
  // wrap to the next line, the button is not looking good anymore.
  //
  // The solution is to instead use gaps, because they are not applied when the items wrap.
  // This is how we ended up with two flex containers, one with gap-1 to separate the avatars,
  // and another with gap-2 to separate the button from the avatars.
  //
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1 flex-wrap">
        <Champion champion={champion} project={project} />
        <Reviewer reviewer={reviewer} project={project} />
        <ContribList contributors={contributors} />
      </div>

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
