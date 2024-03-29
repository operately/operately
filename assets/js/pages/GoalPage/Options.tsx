import * as React from "react";
import * as Icons from "@tabler/icons-react";
import * as PageOptions from "@/components/PaperContainer/PageOptions";
import { Paths } from "@/routes/paths";

export function Options({ goal }) {
  return (
    <PageOptions.Root testId="goal-options" position="top-right">
      {goal.permissions.canEdit && !goal.isClosed && (
        <PageOptions.Link
          icon={Icons.IconEdit}
          title="Edit Goal"
          to={Paths.editGoalPath(goal.id)}
          dataTestId="edit-goal"
        />
      )}

      {goal.permissions.canEdit && !goal.isClosed && (
        <PageOptions.Link
          icon={Icons.IconExchange}
          title="Change Parent"
          to={Paths.editGoalParentPath(goal.id)}
          dataTestId="change-parent-goal"
        />
      )}

      {goal.permissions.canClose && !goal.isClosed && (
        <PageOptions.Link
          icon={Icons.IconCircleCheck}
          title="Mark as Complete"
          to={Paths.closeGoalPath(goal.id)}
          dataTestId="mark-as-complete"
        />
      )}

      {goal.permissions.canArchive && !goal.isArchived && (
        <PageOptions.Link
          icon={Icons.IconTrash}
          title="Archive"
          to={Paths.archiveGoalPath(goal.id)}
          dataTestId="archive-goal"
        />
      )}
    </PageOptions.Root>
  );
}
