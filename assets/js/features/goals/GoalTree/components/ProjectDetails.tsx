import React from "react";

import FormattedTime from "@/components/FormattedTime";
import { AvatarLink } from "@/components/Avatar";

import { splitByStatus } from "@/models/milestones";
import { Project, sortContributorsByRole } from "@/models/projects";
import { StatusSection } from "@/features/projectCheckIns/StatusSection";
import { DescriptionSection } from "@/features/projectCheckIns/DescriptionSection";
import { MiniPieChart } from "@/components/MiniPieChart";
import { MilestoneIcon } from "@/components/MilestoneIcon";
import { DivLink } from "@/components/Link";
import { assertPresent } from "@/utils/assertions";
import { truncateString } from "@/utils/strings";
import { Paths } from "@/routes/paths";

import { Status } from "./Status";
import { ProjectNode } from "../tree";
import { RetrospectiveContent } from "@/features/ProjectRetrospective";

export function ProjectDetails({ node }: { node: ProjectNode }) {
  return (
    <div className="pl-[20px] flex gap-10 items-center">
      <ProjectStatus project={node.project} />
      <MilestoneCompletion project={node.project} />
      <NextMilestone project={node.project} />
      <SpaceName project={node.project} />
      <ContributorsList project={node.project} />
    </div>
  );
}

function ProjectStatus({ project }: { project: Project }) {
  if (project.status === "closed") {
    assertPresent(project.retrospective, "retrospective must be present in project");

    return (
      <Status resource={project} resourceType="project">
        <RetrospectiveContent retrospective={project.retrospective} limit={120} size="sm" />
      </Status>
    );
  } else {
    return (
      <Status resource={project} resourceType="project">
        <StatusSection checkIn={project.lastCheckIn!} reviewer={project.reviewer || undefined} />
        <DescriptionSection checkIn={project.lastCheckIn!} limit={120} />
      </Status>
    );
  }
}

function MilestoneCompletion({ project }: { project: Project }) {
  assertPresent(project.milestones, "milestones must be present in project");

  let { pending, done } = splitByStatus(project.milestones);
  const totalCount = pending.length + done.length;

  if (totalCount === 0) return <></>;

  return (
    <div className="flex items-center gap-2 shrink-0 text-xs text-content-dimmed">
      <MiniPieChart completed={done.length} total={totalCount} />
      {done.length}/{totalCount} completed
    </div>
  );
}

function NextMilestone({ project }: { project: Project }) {
  if (!project.nextMilestone) return <></>;

  const name = truncateString(project.nextMilestone.title!, 40);
  const path = Paths.projectMilestonePath(project.nextMilestone.id!);

  return (
    <DivLink to={path} className="flex items-center gap-2">
      <MilestoneIcon milestone={project.nextMilestone} />
      <div className="flex-1 truncate text-xs text-content-dimmed hover:underline underline-offset-2">
        <FormattedTime time={project.nextMilestone.deadlineAt!} format="short-date" />: {name}
      </div>
    </DivLink>
  );
}

function SpaceName({ project }: { project: Project }) {
  assertPresent(project.space, "space must be present in project");

  const path = Paths.spacePath(project.space.id!);

  return (
    <DivLink to={path} className="text-xs text-content-dimmed hover:underline underline-offset-2">
      {project.space.name}
    </DivLink>
  );
}

function ContributorsList({ project }: { project: Project }) {
  assertPresent(project.contributors, "contributors must be present in project");

  const sortedContributors = sortContributorsByRole(project.contributors);
  const hiddenContribsCount = sortedContributors.length - 8;

  return (
    <div className="flex items-center gap-1">
      {sortedContributors.slice(0, 8).map((contributor) => (
        <AvatarLink key={contributor!.id} person={contributor!.person!} size="tiny" />
      ))}

      {hiddenContribsCount > 0 && (
        <div className="flex items-center justify-center text-[.6rem] w-5 h-5 bg-surface-dimmed text-content-dimmed font-bold rounded-full">
          +{hiddenContribsCount}
        </div>
      )}
    </div>
  );
}
