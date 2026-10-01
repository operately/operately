import { Trans } from "turboui";
import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Goals from "@/models/goals";

import { FormattedTime } from "turboui";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";

export function banner(goal: Goals.Goal) {
  return <GoalStatusBanner goal={goal} />;
}

function GoalStatusBanner({ goal }: { goal: Goals.Goal }) {
  const formattedTimePreferences = useFormattedTimePreferences();

  if (goal.isClosed && goal.closedAt) {
    return (
      <Paper.Banner testId="goal-closed-banner">
        <Trans
          i18nKey="This goal was closed on <date/>"
          components={{
            date: <FormattedTime {...formattedTimePreferences} time={goal.closedAt} format="long-date" />,
          }}
        />
      </Paper.Banner>
    );
  }

  if (goal.isArchived && goal.archivedAt) {
    return (
      <Paper.Banner testId="goal-archived-banner">
        <Trans
          i18nKey="This goal was archived on <date/>"
          components={{
            date: <FormattedTime {...formattedTimePreferences} time={goal.archivedAt} format="long-date" />,
          }}
        />
      </Paper.Banner>
    );
  }

  return null;
}
