import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Goals from "@/models/goals";

import { Paths } from "@/routes/paths";

export function GoalSubpageNavigation({ goal }: { goal: Goals.Goal }) {
  const goalPath = Paths.goalPath(goal.id);
  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={goalPath}>{goal.name}</Paper.NavItem>
    </Paper.Navigation>
  );
}
