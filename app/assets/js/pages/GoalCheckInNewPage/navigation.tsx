import i18n from "@/i18n";
import * as Paper from "@/components/PaperContainer";
import * as React from "react";

import { Goal } from "@/models/goals";
import { Paths, usePaths } from "@/routes/paths";

import { useLoadedData } from "./loader";

export function buildGoalCheckInNewNavigation(goal: Goal, paths: Paths): Paper.NavigationItem[] {
  const items: Paper.NavigationItem[] = [];

  if (goal.space) {
    items.push({ to: paths.spacePath(goal.space.id), label: goal.space.name });
    items.push({ to: paths.spaceWorkMapPath(goal.space.id), label: i18n.t("Work Map") });
  } else {
    items.push({ to: paths.workMapPath("goals"), label: i18n.t("Work Map") });
  }

  items.push({ to: paths.goalPath(goal.id), label: goal.name });
  items.push({ to: paths.goalPath(goal.id, { tab: "check-ins" }), label: i18n.t("Check-ins") });

  return items;
}

export function Navigation() {
  const paths = usePaths();
  const { goal } = useLoadedData();

  return <Paper.Navigation items={buildGoalCheckInNewNavigation(goal, paths)} />;
}
