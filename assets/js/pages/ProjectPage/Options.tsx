import * as React from "react";
import * as Icons from "@tabler/icons-react";
import * as Projects from "@/models/projects";
import * as PageOptions from "@/components/PaperContainer/PageOptions";

import { Paths } from "@/routes/paths";

export default function Options({ project }) {
  return (
    <PageOptions.Root testId="project-options-button">
      {!project.permissions.canEdit && Projects.isResumable(project) && (
        <PageOptions.Link
          icon={Icons.IconPlayerPlayFilled}
          title="Resume the project"
          to={Paths.resumeProjectPath(project.id)}
          dataTestId="resume-project-link"
        />
      )}

      {!project.permissions.canEdit && (
        <PageOptions.Link
          icon={Icons.IconEdit}
          title="Edit project name"
          to={Paths.editProjectNamePath(project.id)}
          dataTestId="edit-project-name-button"
        />
      )}

      {!project.permissions.canEdit && Projects.isPausable(project) && (
        <PageOptions.Link
          icon={Icons.IconPlayerPauseFilled}
          title="Pause the project"
          to={Paths.pauseProjectPath(project.id)}
          dataTestId="pause-project-link"
        />
      )}

      {!project.permissions.canEdit && (
        <PageOptions.Link
          icon={Icons.IconExchange}
          title="Change Parent Goal"
          to={Paths.editProjectGoalPath(project.id)}
          dataTestId="change-parent"
        />
      )}

      {!project.permissions.canEdit && (
        <PageOptions.Link
          icon={Icons.IconReplace}
          title="Move project to another space"
          to={Paths.moveProjectPath(project.id)}
          dataTestId="move-project-link"
        />
      )}
    </PageOptions.Root>
  );
}
