import * as React from "react";
import * as Icons from "@tabler/icons-react";
import * as PageOptions from "@/components/PaperContainer/PageOptions";

import { Paths } from "@/routes/paths";

import { useSetPageMode } from ".";

export function Options({ goal }) {
  const setPageMode = useSetPageMode();
  const editMode = () => setPageMode("edit");

  return (
    <PageOptions.Root testId="goal-options">
      {goal.permissions.canEdit && !goal.isClosed && (
        <PageOptions.Action
          icon={Icons.IconEdit}
          title="Edit"
          onClick={editMode}
          testId="edit-goal-definition"
          keepOutsideOnBigScreen
        />
      )}

      {goal.permissions.canEdit && !goal.isClosed && (
        <PageOptions.Link
          icon={Icons.IconCalendar}
          title="Edit Timeframe"
          to={Paths.goalEditTimeframePath(goal.id)}
          testId="edit-goal-timeframe"
        />
      )}

      {goal.permissions.canEdit && !goal.isClosed && (
        <PageOptions.Link
          icon={Icons.IconExchange}
          title="Change Parent"
          to={Paths.goalEditParentPath(goal.id)}
          testId="change-parent-goal"
        />
      )}

      {goal.permissions.canClose && !goal.isClosed && (
        <PageOptions.Link
          icon={Icons.IconCircleCheck}
          title="Close Goal"
          to={Paths.goalClosePath(goal.id)}
          testId="close-goal"
        />
      )}

      {goal.permissions.canClose && goal.isClosed && (
        <PageOptions.Link
          icon={Icons.IconRotateDot}
          title="Reopen Goal"
          to={Paths.goalReopenPath(goal.id)}
          testId="reopen-goal"
        />
      )}
    </PageOptions.Root>
  );
}
