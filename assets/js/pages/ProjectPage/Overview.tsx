import React from "react";

import * as Projects from "@/models/projects";
import { StatusIndicator } from "@/features/ProjectListItem/StatusIndicator";
import { MiniPieChart } from "@/components/MiniPieChart";
import { DimmedLabel } from "./Label";


export default function Overview({ project }) {
  return (
    <div className="flex items-start gap-12 text-sm">
      <Status project={project} />
      <Completion project={project} />
    </div>
  );
}

function Status({ project }: { project: Projects.Project }) {
  return (
    <div>
      <DimmedLabel>Status</DimmedLabel>
      <StatusIndicator project={project} />
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
