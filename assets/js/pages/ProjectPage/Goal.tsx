import React from "react";

import * as Projects from "@/graphql/Projects";
import { GhostButton } from "@/components/Button";
import { createPath } from "@/utils/paths";

export default function Goal({ project }: { project: Projects.Project }) {
  if (project.goal) {
    return <ConnectedGoalState project={project} />;
  } else {
    return <ZeroState project={project} />;
  }
}

function ConnectedGoalState({ project }: { project: Projects.Project }) {
  return <>Connected</>;
}

function ZeroState({ project }: { project: Projects.Project }) {
  const writePath = createPath("projects", project.id, "edit", "goal");

  const editLink = (
    <GhostButton linkTo={writePath} testId="write-project-description-link" size="xs" type="secondary">
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
