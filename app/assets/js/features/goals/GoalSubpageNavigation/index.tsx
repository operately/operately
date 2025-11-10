import * as Paper from "@/components/PaperContainer";
import * as Goals from "@/models/goals";
import * as React from "react";

import { usePaths } from "@/routes/paths";

export function GoalSubpageNavigation({ goal }: { goal: Goals.Goal }) {
  const paths = usePaths();

  return <Paper.Navigation items={[{ to: paths.goalPath(goal.id!), label: goal.name! }]} />;
}
