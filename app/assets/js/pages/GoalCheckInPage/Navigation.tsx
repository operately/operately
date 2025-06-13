import * as Paper from "@/components/PaperContainer";
import * as React from "react";

import { assertPresent } from "@/utils/assertions";
import { useLoadedData } from "./loader";

import { usePaths } from "@/routes/paths";
export function Navigation() {
  const paths = usePaths();
  const { goal } = useLoadedData();

  assertPresent(goal.space, "space must be present in goal");

  return (
    <Paper.Navigation
      items={[
        { to: paths.spacePath(goal.space.id!), label: goal.space.name! },
        { to: paths.spaceGoalsPath(goal.space.id!), label: "Goals & Projects" },
        { to: paths.goalPath(goal.id!), label: goal.name! },
      ]}
    />
  );
}
