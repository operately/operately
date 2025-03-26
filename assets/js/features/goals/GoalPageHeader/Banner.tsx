import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Goals from "@/models/goals";

import { assertPresent } from "@/utils/assertions";

import FormattedTime from "@/components/FormattedTime";

export function banner(goal: Goals.Goal) {
  assertPresent(goal.isClosed, "isClosed must be present in goal");
  assertPresent(goal.isArchived, "isArchived must be present in goal");

  if (goal.isClosed) {
    return (
      <Paper.Banner>
        This goal was closed on <FormattedTime time={goal.closedAt!} format="long-date" />
      </Paper.Banner>
    );
  }

  if (goal.isArchived) {
    return (
      <Paper.Banner>
        This goal was archived on <FormattedTime time={goal.archivedAt!} format="long-date" />
      </Paper.Banner>
    );
  }

  return null;
}
