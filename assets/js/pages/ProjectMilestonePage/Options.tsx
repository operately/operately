import * as React from "react";
import * as Icons from "@tabler/icons-react";
import * as PageOptions from "@/components/PaperContainer/PageOptions";
import { FormState } from "./useForm";

export function Options({ form }: { form: FormState }) {
  if (form.titleAndDeadline.state === "edit") return null;

  return (
    <PageOptions.Root testId="project-options-button" position="top-right">
      {form.milestone.permissions?.canEditMilestone && (
        <PageOptions.Action
          icon={Icons.IconEdit}
          title="Edit Name and Due Date"
          onClick={form.titleAndDeadline.startEditing}
          testId="edit-project-name-button"
        />
      )}
      {form.milestone.permissions?.canEditMilestone && (
        <PageOptions.Action
          icon={Icons.IconArchive}
          title="Archive this milestone"
          onClick={form.archive}
          testId="archive-milestone-button"
        />
      )}
    </PageOptions.Root>
  );
}
