import * as React from "react";
import * as Icons from "@tabler/icons-react";
import * as PageOptions from "@/components/PaperContainer/PageOptions";

export function Options({ goal }) {
  return (
    <PageOptions.Root testId="goal-options">
      {!goal.permissions.canEdit && (
        <PageOptions.Link
          icon={Icons.IconEdit}
          title="Edit Goal"
          to={`/goals/${goal.id}/edit`}
          dataTestId="edit-goal"
        />
      )}

      {!goal.isArchived && (
        <PageOptions.Link
          icon={Icons.IconTrash}
          title="Archive"
          to={`/goals/${goal.id}/archive`}
          dataTestId="archive-goal"
        />
      )}
    </PageOptions.Root>
  );
}
