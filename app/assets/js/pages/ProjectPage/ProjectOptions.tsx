import * as PageOptions from "@/components/PaperContainer/PageOptions";
import * as Projects from "@/models/projects";
import * as Icons from "@tabler/icons-react";
import * as React from "react";

import { usePaths } from "@/routes/paths";
export function ProjectOptions({ project }) {
  const paths = usePaths();
  return (
    <PageOptions.Root testId="project-options-button">
      {project.permissions.canPause && Projects.isResumable(project) && (
        <PageOptions.Link
          icon={Icons.IconPlayerPlayFilled}
          title="Resume the project"
          to={paths.resumeProjectPath(project.id)}
          testId="resume-project-link"
        />
      )}

      {project.permissions.canEditName && (
        <PageOptions.Link
          icon={Icons.IconEdit}
          title="Edit project name"
          to={paths.editProjectNamePath(project.id)}
          testId="edit-project-name-button"
        />
      )}

      {project.permissions.canPause && Projects.isPausable(project) && (
        <PageOptions.Link
          icon={Icons.IconPlayerPauseFilled}
          title="Pause the project"
          to={paths.pauseProjectPath(project.id)}
          testId="pause-project-link"
        />
      )}

      {project.permissions.canEditGoal && (
        <PageOptions.Link
          icon={Icons.IconExchange}
          title="Change Parent Goal"
          to={paths.editProjectGoalPath(project.id)}
          testId="connect-project-to-goal-link"
        />
      )}

      {project.permissions.canEditSpace && (
        <PageOptions.Link
          icon={Icons.IconReplace}
          title="Move project to another space"
          to={paths.moveProjectPath(project.id)}
          testId="move-project-link"
        />
      )}

      {project.permissions.canClose && project.status !== "closed" && (
        <PageOptions.Link
          icon={Icons.IconCircleCheck}
          title="Close the project"
          to={paths.projectClosePath(project.id)}
          testId="close-project"
        />
      )}
    </PageOptions.Root>
  );
}
