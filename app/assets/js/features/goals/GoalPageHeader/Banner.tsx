import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Goals from "@/models/goals";

import { assertPresent } from "@/utils/assertions";

import { FormattedTime } from "turboui";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";

export function banner(goal: Goals.Goal) {
  return <GoalStatusBanner goal={goal} />;
}

function GoalStatusBanner({ goal }: { goal: Goals.Goal }) {
  const formattedTimePreferences = useFormattedTimePreferences();

  assertPresent(goal.isClosed, "isClosed must be present in goal");
  assertPresent(goal.isArchived, "isArchived must be present in goal");

  if (goal.isClosed) {
    return (
      <Paper.Banner>
        This goal was closed on <FormattedTime {...formattedTimePreferences} time={goal.closedAt!} format="long-date" />
      </Paper.Banner>
    );
  }

  if (goal.isArchived) {
    return (
      <Paper.Banner>
        This goal was archived on <FormattedTime {...formattedTimePreferences} time={goal.archivedAt!} format="long-date" />
      </Paper.Banner>
    );
  }

  return null;
}
