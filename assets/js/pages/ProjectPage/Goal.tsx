import React from "react";

import * as Projects from "@/models/projects";
import { GhostButton } from "@/components/Button";
import { createPath } from "@/utils/paths";
import Avatar from "@/components/Avatar";
import { Link } from "@/components/Link";
import { createTestId } from "@/utils/testid";
import * as Goals from "@/models/goals";

export default function Goal({ project }: { project: Projects.Project }) {
  if (project.goal) {
    return <ConnectedGoalState project={project} />;
  } else {
    return <ZeroState project={project} />;
  }
}

function ConnectedGoalState({ project }: { project: Projects.Project }) {
  const goal = project.goal!;
  const goalPath = createPath("goals", project.goal!.id);
  const testid = createTestId("visit-goal", goal.name);

  return (
    <div className="flex items-start justify-between">
      <div>
        <div className="text-content-primary font-bold">
          <Link to={goalPath} testId={testid}>
            {goal.name}
          </Link>
        </div>

        <div className="mt-2">
          {goal.targets!.map((target, index) => (
            <div key={index} className="flex items-center gap-1 text-sm">
              <div className="text-ellipsis w-96">{target!.name}</div>
              <ProgressBar target={target!} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Avatar person={goal.champion!} size={24} />
        <Avatar person={goal.reviewer!} size={24} />
      </div>
    </div>
  );
}

function ZeroState({ project }: { project: Projects.Project }) {
  const writePath = createPath("projects", project.id, "edit", "goal");

  const editLink = (
    <GhostButton linkTo={writePath} testId="connect-goal" size="xs" type="secondary">
      Connect a Goal
    </GhostButton>
  );

  return (
    <div className="text-sm">
      Not yet connected with a goal.
      {project.permissions.canEditDescription && <div className="mt-2 flex">{editLink}</div>}
    </div>
  );
}

function ProgressBar({ target }: { target: Goals.Target }) {
  const from = target!.from!;
  const to = target!.to!;
  const value = target!.value!;

  let progress = Math.round(((value - from) / (to - from)) * 100);
  if (progress < 0) progress = 0;
  if (progress > 100) progress = 100;

  let color = "";
  if (progress < 20) color = "bg-yellow-300";
  if (progress >= 40 && progress < 80) color = "bg-yellow-500";
  if (progress >= 70) color = "bg-green-600";

  return (
    <div className="text-ellipsis w-40 bg-gray-200 relative h-3 overflow-hidden rounded-sm">
      <div className={"absolute top-0 left-0 h-full" + " " + color} style={{ width: `${progress}%` }} />
    </div>
  );
}
