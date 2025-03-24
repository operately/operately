import * as React from "react";
import * as Paper from "@/components/PaperContainer";

import { Paths } from "@/routes/paths";
import { useLoadedData } from "./loader";
import { assertPresent } from "@/utils/assertions";

export function Navigation() {
  const { goal } = useLoadedData();

  assertPresent(goal.space, "space must be present in goal");

  return (
    <Paper.Navigation
      items={[
        { to: Paths.spacePath(goal.space.id!), label: goal.space.name! },
        { to: Paths.spaceGoalsPath(goal.space.id!), label: "Goals & Projects" },
        { to: Paths.goalPath(goal.id!), label: goal.name! },
      ]}
    />
  );
}
