import React from "react";

import * as Paper from "@/components/PaperContainer";
import * as Spaces from "@/models/spaces";

import { Paths } from "@/routes/paths";

export function Navigation({ space }: { space: Spaces.Space }) {
  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={Paths.spacePath(space.id!)}>{space.name}</Paper.NavItem>
      <Paper.NavSeparator />
      <Paper.NavItem linkTo={Paths.spaceGoalsPath(space.id!)}>Goals & Projects</Paper.NavItem>
    </Paper.Navigation>
  );
}
