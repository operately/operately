import React from "react";

import FormattedTime from "@/components/FormattedTime";
import { useWindowSizeBreakpoints } from "@/components/Pages";

import classNames from "classnames";
import { match } from "ts-pattern";
import { splitByStatus } from "@/models/milestones";
import { Project, sortContributorsByRole } from "@/models/projects";
import { StatusSection } from "@/features/projectCheckIns/StatusSection";
import { DescriptionSection } from "@/features/projectCheckIns/DescriptionSection";
import { MiniPieChart } from "@/components/charts/MiniPieChart";
import { MilestoneIcon } from "@/components/MilestoneIcon";
import { DivLink } from "@/components/Link";
import { assertPresent } from "@/utils/assertions";
import { truncateString } from "@/utils/strings";
import { Paths } from "@/routes/paths";
import { RetrospectiveContent } from "@/features/ProjectRetrospective";
import AvatarList from "@/components/AvatarList";

import { Status } from "./Status";
import { ProjectNode } from "../tree";
import { useTreeContext } from "../treeContext";

export function ProjectDetails({ node }: { node: ProjectNode }) {
  const { density } = useTreeContext();
  const size = useWindowSizeBreakpoints();

  if (density === "compact") return <></>;

  const layout = match(size)
    .with("xl", () => "flex")
    .with("lg", () => "flex")
    .with("md", () => "grid grid-cols-[auto,auto,1fr]")
    .otherwise(() => "grid grid-cols-[auto,1fr]");

  const className = classNames("pl-6 mt-1 ml-[2px] gap-x-10 gap-y-2 items-center", layout);

  return (
    <div className={className}>
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
  const size = useWindowSizeBreakpoints();

  if (!project.nextMilestone) return <></>;

  const name = truncateString(project.nextMilestone.title!, size !== "xs" ? 30 : 20);
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

  const size = useWindowSizeBreakpoints();
  const sortedContributors = sortContributorsByRole(project.contributors);

  const maxElements = match(size)
    .with("xl", () => 8)
    .with("lg", () => 6)
    .otherwise(() => 4);

  return <AvatarList people={sortedContributors.map((c) => c.person!)} size="tiny" linked maxElements={maxElements} />;
}
