import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Icons from "@tabler/icons-react";
import * as PageOptions from "@/components/PaperContainer/PageOptions";

import { useLoadedData } from "./loader";
import { assertPresent } from "@/utils/assertions";

export function Options() {
  const { goal } = useLoadedData();

  assertPresent(goal.permissions, "permissions must be present in goal");

  const viewMode = Pages.useIsViewMode();
  const setPageMode = Pages.useSetPageMode();
  const isEditVisible = goal.permissions.canEdit && viewMode;

  return (
    <PageOptions.Root testId="goal-options">
      {isEditVisible && (
        <PageOptions.Action
          icon={Icons.IconEdit}
          title="Edit"
          onClick={() => setPageMode("edit")}
          testId="edit-goal-definition"
          keepOutsideOnBigScreen
        />
      )}
    </PageOptions.Root>
  );
}
