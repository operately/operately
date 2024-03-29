import React from "react";

import FormattedTime from "@/components/FormattedTime";
import * as Paper from "@/components/PaperContainer";

export function Banner({ goal }) {
  if (goal.isClosed) {
    return (
      <Paper.Banner>
        This goal was completed on <FormattedTime time={goal.closedAt} format="long-date" />
      </Paper.Banner>
    );
  }

  if (goal.isArchived) {
    return (
      <Paper.Banner>
        This goal was archived on <FormattedTime time={goal.archivedAt} format="long-date" />
      </Paper.Banner>
    );
  }

  return null;
}
