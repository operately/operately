import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Goals from "@/models/goals";

import { Paths } from "@/routes/paths";

export function GoalSubpageNavigation({ goal }: { goal: Goals.Goal }) {
  return <Paper.Navigation items={[{ to: Paths.goalPath(goal.id!), label: goal.name! }]} />;
}
