import * as React from "react";
import * as Icons from "@tabler/icons-react";
import * as Projects from "@/models/projects";
import * as PageOptions from "@/components/PaperContainer/PageOptions";

export default function Options({ project }) {
  return (
    <PageOptions.Root testId="project-options-button">
      {Projects.isResumable(project) && (
        <PageOptions.Link
          icon={Icons.IconPlayerPlayFilled}
          title="Resume the project"
          to={`/projects/${project.id}/resume`}
          dataTestId="resume-project-link"
        />
      )}
      <PageOptions.Link
        icon={Icons.IconEdit}
        title="Edit project name"
        to={`/projects/${project.id}/edit/name`}
        dataTestId="edit-project-name-button"
      />
      {Projects.isPausable(project) && (
        <PageOptions.Link
          icon={Icons.IconPlayerPauseFilled}
          title="Pause the project"
          to={`/projects/${project.id}/pause`}
          dataTestId="pause-project-link"
        />
      )}
      <PageOptions.Link
        icon={Icons.IconReplace}
        title="Move project to another space"
        to={`/projects/${project.id}/move`}
        dataTestId="move-project-link"
      />
    </PageOptions.Root>
  );
}
