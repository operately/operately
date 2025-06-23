import * as React from "react";

import * as PageOptions from "@/components/PaperContainer/PageOptions";
import { IconEdit, IconArchive } from "turboui";
import { FormState } from "./useForm";

export function Options({ form }: { form: FormState }) {
  if (form.titleAndDeadline.state === "edit") return null;

  return (
    <PageOptions.Root testId="project-options-button">
      {form.milestone.permissions?.canEditMilestone && (
        <PageOptions.Action
          icon={IconEdit}
          title="Edit Name and Due Date"
          onClick={form.titleAndDeadline.startEditing}
          testId="edit-project-name-button"
        />
      )}
      {form.milestone.permissions?.canEditMilestone && (
        <PageOptions.Action
          icon={IconArchive}
          title="Archive this milestone"
          onClick={form.archive}
          testId="archive-milestone-button"
        />
      )}
    </PageOptions.Root>
  );
}
