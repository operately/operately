import * as React from "react";
import * as Icons from "@tabler/icons-react";
import * as PageOptions from "@/components/PaperContainer/PageOptions";

export default function Options({ project }) {
  return (
    <PageOptions.Root testId="project-options">
      <PageOptions.Link
        icon={Icons.IconEdit}
        title="Edit project name"
        to={`/projects/${project.id}/edit/name`}
        dataTestId="edit-project-name-button"
      />
      <PageOptions.Link
        icon={Icons.IconReplace}
        title="Move project to another space"
        to={`/projects/${project.id}/move`}
        dataTestId="move-project-link"
      />
      <PageOptions.Link
        icon={Icons.IconArchive}
        title="Archive this project"
        to={`/projects/${project.id}/archive`}
        dataTestId="archive-project-link"
      />
    </PageOptions.Root>
  );
}
