import React from "react";

import { DimmedLabel } from "./Label";

import * as Projects from "@/models/projects";
import { createPath } from "@/utils/paths";
import { GhostButton } from "@/components/Button";
import { MiniPieChart } from "@/components/MiniPieChart";
import { SmallStatusIndicator } from "@/features/projectCheckIns/SmallStatusIndicator";

export default function Overview({ project }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-start gap-12 text-sm">
        <Status project={project} />
        <Completion project={project} />
      </div>

      <CloseButton project={project} />
    </div>
  );
}

function Status({ project }: { project: Projects.Project }) {
  return (
    <div>
      <DimmedLabel>Status</DimmedLabel>
      <SmallStatusIndicator status={project.lastCheckIn?.status || "on_track"} />
    </div>
  );
}

function Completion({ project }: { project: Projects.Project }) {
  const pending = project.milestones!.filter((m) => m!.status === "pending");
  const done = project.milestones!.filter((m) => m!.status === "done");
  const total = pending.length + done.length;

  return (
    <div>
      <DimmedLabel>Completion</DimmedLabel>

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
      <span className="font-medium">All Milestones Completed</span>
    </div>
  );
}

function CompletionPieChart({ done, total }) {
  return (
    <div className="flex items-center gap-2">
      <MiniPieChart completed={done} total={total} size={16} />
      <span className="font-medium">
        {done}/{total} milestones completed
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
