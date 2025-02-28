import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Goals from "@/models/goals";

import { Paths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";

export function GoalSubpageNavigation({ goal }: { goal: Goals.Goal }) {
  assertPresent(goal.id, "Goal id must be defined");
  assertPresent(goal.space, "Goal space must be defined");
  assertPresent(goal.space.id, "Goal space id must be defined");

  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={Paths.spacePath(goal.space.id)}>{goal.space.name}</Paper.NavItem>
      <Paper.NavSeparator />
      <Paper.NavItem linkTo={Paths.goalPath(goal.id)}>Goals &amp; Projects</Paper.NavItem>
      <Paper.NavSeparator />
      <Paper.NavItem linkTo={Paths.goalPath(goal.id)}>{goal.name}</Paper.NavItem>
    </Paper.Navigation>
  );
}
