import * as React from "react";
import * as Icons from "@tabler/icons-react";
import * as PageOptions from "@/components/PaperContainer/PageOptions";

export function Options({ form }) {
  if (form.titleAndDeadline.state === "edit") return null;

  return (
    <PageOptions.Root testId="project-options-button" position="top-right">
      <PageOptions.Action
        icon={Icons.IconEdit}
        title="Edit Name and Due Date"
        onClick={form.titleAndDeadline.startEditing}
        dataTestId="edit-project-name-button"
      />
      <PageOptions.Action
        icon={Icons.IconArchive}
        title="Archive this milestone"
        onClick={form.archive}
        dataTestId="archive-milestone-button"
      />
    </PageOptions.Root>
  );
}
