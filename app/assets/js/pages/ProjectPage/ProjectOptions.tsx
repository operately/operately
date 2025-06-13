import * as PageOptions from "@/components/PaperContainer/PageOptions";
import * as Projects from "@/models/projects";
import * as Icons from "@tabler/icons-react";
import * as React from "react";

export function ProjectOptions({ project }) {
  return (
    <PageOptions.Root testId="project-options-button">
      {project.permissions.canPause && Projects.isResumable(project) && (
        <PageOptions.Link
          icon={Icons.IconPlayerPlayFilled}
          title="Resume the project"
          to={DeprecatedPaths.resumeProjectPath(project.id)}
          testId="resume-project-link"
        />
      )}

      {project.permissions.canEditName && (
        <PageOptions.Link
          icon={Icons.IconEdit}
          title="Edit project name"
          to={DeprecatedPaths.editProjectNamePath(project.id)}
          testId="edit-project-name-button"
        />
      )}

      {project.permissions.canPause && Projects.isPausable(project) && (
        <PageOptions.Link
          icon={Icons.IconPlayerPauseFilled}
          title="Pause the project"
          to={DeprecatedPaths.pauseProjectPath(project.id)}
          testId="pause-project-link"
        />
      )}

      {project.permissions.canEditGoal && (
        <PageOptions.Link
          icon={Icons.IconExchange}
          title="Change Parent Goal"
          to={DeprecatedPaths.editProjectGoalPath(project.id)}
          testId="connect-project-to-goal-link"
        />
      )}

      {project.permissions.canEditSpace && (
        <PageOptions.Link
          icon={Icons.IconReplace}
          title="Move project to another space"
          to={DeprecatedPaths.moveProjectPath(project.id)}
          testId="move-project-link"
        />
      )}

      {project.permissions.canClose && project.status !== "closed" && (
        <PageOptions.Link
          icon={Icons.IconCircleCheck}
          title="Close the project"
          to={DeprecatedPaths.projectClosePath(project.id)}
          testId="close-project"
        />
      )}
    </PageOptions.Root>
  );
}
