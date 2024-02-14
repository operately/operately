import * as React from "react";
import * as Icons from "@tabler/icons-react";
import * as PageOptions from "@/components/PaperContainer/PageOptions";

export function Options({ form }) {
  return (
    <PageOptions.Root testId="project-options-button" position="top-right">
      <PageOptions.Action
        icon={Icons.IconEdit}
        title="Edit title"
        onClick={form.title.startEditing}
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
