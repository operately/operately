import React from "react";

import { DimmedLabel } from "./Label";
import { Indicator } from "@/components/ProjectHealthIndicators";

import * as Projects from "@/graphql/Projects";
import { createPath } from "@/utils/paths";
import { GhostButton } from "@/components/Button";

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
      <Indicator value={project.health} type="status" />
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
      <MiniPieChart completed={done} total={total} />
      <span className="font-medium">
        {done}/{total} milestones completed
      </span>
    </div>
  );
}

function MiniPieChart({ completed, total }) {
  const percentage = Math.ceil((completed / total) * 100);

  return (
    <div
      style={{
        borderRadius: "50%",
        backgroundImage: `conic-gradient(var(--color-green-500) ${percentage}%, var(--color-green-300) ${percentage}% 100%)`,
        height: "14px",
        width: "14px",
      }}
    />
  );
}

function CloseButton({ project }: { project: Projects.Project }) {
  const type = Projects.allMilestonesCompleted(project) ? "primary" : "secondary";
  const linkTo = createPath("projects", project.id, "close");

  return (
    <GhostButton type={type} linkTo={linkTo} size="sm">
      Close Project
    </GhostButton>
  );
}
