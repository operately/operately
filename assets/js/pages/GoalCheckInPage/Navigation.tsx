import * as React from "react";
import * as Paper from "@/components/PaperContainer";

import { Paths } from "@/routes/paths";
import { useLoadedData } from "@/components/Pages";
import { assertPresent } from "@/utils/assertions";

export function Navigation() {
  const { goal } = useLoadedData();

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
