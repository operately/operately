import React from "react";

import * as Projects from "@/graphql/Projects";
import * as Time from "@/utils/time";

import Button from "@/components/Button";
import { ProjectLifecycleGraph } from "@/components/ProjectLifecycleGraph";

interface ContextDescriptor {
  project: Projects.Project;
  refetch: () => void;
  editable: boolean;
}

const Context = React.createContext<ContextDescriptor | null>(null);

export default function Timeline({ project, refetch, editable }) {
  return (
    <Context.Provider value={{ project, refetch, editable }}>
      <div className="my-8" data-test-id="timeline">
        <div className="flex items-start justify-between">
          <div className="font-extrabold text-lg text-white-1 leading-none">Timeline</div>
          <div>
            <EditTimeline project={project} />
          </div>
        </div>

        <MilestonesSection project={project} />

        <div className="rounded-lg shadow-lg bg-dark-3 my-4">
          <ProjectLifecycleGraph
            milestones={project.milestones}
            projectStart={Time.parse(project.startedAt)}
            projectEnd={Time.parse(project.phaseHistory.find((phase) => phase.phase === "control")?.dueTime)}
            planningDue={project.phaseHistory.find((phase) => phase.phase === "planning")?.dueTime || null}
            executionDue={project.phaseHistory.find((phase) => phase.phase === "execution")?.dueTime || null}
            controlDue={project.phaseHistory.find((phase) => phase.phase === "control")?.dueTime || null}
          />
        </div>
      </div>
    </Context.Provider>
  );
}

function EditTimeline({ project }) {
  return (
    <Button variant="secondary" data-test-id="edit-project-timeline" linkTo={`/projects/${project.id}/edit/timeline`}>
      Edit Timeline
    </Button>
  );
}

function MilestonesSection({ project }) {
  const completedMilestones = project.milestones.filter((milestone) => milestone.completedAt);
  const totalMilestones = project.milestones.length;

  return (
    <div className="flex items-center gap-2">
      <MiniPieChart completed={completedMilestones.length} total={totalMilestones} />

      <span className="font-semibold">
        {completedMilestones.length}/{totalMilestones} milestones completed
      </span>
      <span className="mx-0.5">&middot;</span>
      <span className="underline cursor-pointer decoration-blue-400 text-blue-400">View all milestones</span>
    </div>
  );
}

function MiniPieChart({ completed, total }) {
  const percentage = Math.ceil((completed / total) * 100);

  return (
    <div
      style={{
        borderRadius: "50%",
        backgroundImage: `conic-gradient(var(--color-green-400) ${percentage}%, var(--color-green-900) ${percentage}% 100%)`,
        height: "16px",
        width: "16px",
      }}
    />
  );
}
