import React from "react";

import { DimmedLabel } from "./Label";

import * as Projects from "@/models/projects";
import { createPath } from "@/utils/paths";
import { GhostButton } from "@/components/Button";
import { StatusIndicator } from "@/features/ProjectListItem/StatusIndicator";
import { MiniPieChart } from "@/components/MiniPieChart";
import { MilestoneIcon } from "@/components/MilestoneIcon";
import FormattedTime from "@/components/FormattedTime";

export default function Overview({ project }) {
  return (
    <div className="flex items-center gap-16 py-6">
      <Status project={project} />
      <Timeframe project={project} />
      <Completion project={project} />
      <NextMilestone project={project} />
    </div>
  );
}
// <CloseButton project={project} />

function Status({ project }: { project: Projects.Project }) {
  return (
    <div className="font-medium">
      <div className="uppercase text-xs font-bold mb-2">Status</div>
      <StatusIndicator project={project} />
    </div>
  );
}

function Timeframe({ project }: { project: Projects.Project }) {
  return (
    <div className="font-medium">
      <div className="uppercase text-xs font-bold mb-2">Timeframe</div>
      <div className="text-content-accent font-medium">
        <FormattedTime time={project.startedAt} format="short-date" />
        {" - "}
        <FormattedTime time={project.deadline} format="short-date" />
      </div>
    </div>
  );
}

function NextMilestone({ project }: { project: Projects.Project }) {
  return (
    <div className="font-medium">
      <div className="uppercase text-xs font-bold mb-2">Next Milestone</div>
      <div className="flex items-center gap-1.5">
        <MilestoneIcon milestone={project.milestones![0]} />
        {project.milestones![0] ? (
          <div className="text-content-accent font-medium">{project.milestones![0].title}</div>
        ) : (
          <DimmedLabel>No milestones set</DimmedLabel>
        )}
      </div>
    </div>
  );
}

function Completion({ project }: { project: Projects.Project }) {
  const pending = project.milestones!.filter((m) => m!.status === "pending");
  const done = project.milestones!.filter((m) => m!.status === "done");
  const total = pending.length + done.length;

  return (
    <div>
      <div className="uppercase text-xs font-bold mb-2">PROGRESS</div>

      {pending.length === 0 && done.length === 0 && <NoMilestones />}
      {pending.length === 0 && done.length > 0 && <AllCompleted />}
      {pending.length > 0 && <CompletionPieChart done={done.length} total={total} />}
    </div>
  );
}

function NoMilestones() {
  return <div className="flex items-center gap-2 text-content-dimmed">Milestones not yet set</div>;
}

function AllCompleted() {
  return (
    <div className="flex items-center gap-2">
      <MiniPieChart completed={10} total={10} />
      <span className="font-medium">All Milestones Done</span>
    </div>
  );
}

function CompletionPieChart({ done, total }) {
  return (
    <div className="flex items-center gap-2">
      <MiniPieChart completed={done} total={total} size={16} />
      <span className="font-medium">
        {done}/{total} milestones done
      </span>
    </div>
  );
}

function CloseButton({ project }: { project: Projects.Project }) {
  if (project.status === "closed") return null;
  if (project.isArchived) return null;

  const type = Projects.allMilestonesCompleted(project) ? "primary" : "secondary";
  const linkTo = createPath("projects", project.id, "close");

  return (
    <GhostButton type={type} linkTo={linkTo} size="sm" testId="close-project-button">
      Close Project
    </GhostButton>
  );
}
