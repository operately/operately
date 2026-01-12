import * as Paper from "@/components/PaperContainer";
import * as Goals from "@/models/goals";
import * as React from "react";

import { usePaths } from "@/routes/paths";

export function GoalSubpageNavigation({ goal }: { goal: Goals.Goal }) {
  const paths = usePaths();
  const items: Array<{ to: string; label: string }> = [];

  if (goal.space) {
    items.push({ to: paths.spacePath(goal.space.id), label: goal.space.name });
    items.push({ to: paths.spaceWorkMapPath(goal.space.id), label: "Work Map" });
  }
  items.push({ to: paths.goalPath(goal.id), label: goal.name });
  items.push({ to: paths.goalPath(goal.id, { tab: "discussions" }), label: "Discussions" });

  return <Paper.Navigation items={items} />;
}
