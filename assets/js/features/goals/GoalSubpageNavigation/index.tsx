import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Goals from "@/models/goals";

import { Paths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";

export function GoalSubpageNavigation({ goal }: { goal: Goals.Goal }) {
  const goalPath = Paths.goalPath(goal.id!);

  assertPresent(goal.space, "space must be present in goal");

  return (
    <Paper.Navigation>
      <Paper.NavSpaceLink space={goal.space} />
      <Paper.NavSeparator />
      <Paper.NavSpaceWorkMapLink space={goal.space} />
      <Paper.NavSeparator />
      <Paper.NavItem linkTo={goalPath}>{goal.name}</Paper.NavItem>
    </Paper.Navigation>
  );
}
