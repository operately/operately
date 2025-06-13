import * as Paper from "@/components/PaperContainer";
import * as Goals from "@/models/goals";
import * as React from "react";

export function GoalSubpageNavigation({ goal }: { goal: Goals.Goal }) {
  return <Paper.Navigation items={[{ to: paths.goalPath(goal.id!), label: goal.name! }]} />;
}
