import React from "react";

import * as Spaces from "@/models/spaces";
import * as Paper from "@/components/PaperContainer";

import { Paths } from "@/routes/paths";

export function SpacePageNavigation({ space }: { space: Spaces.Space }) {
  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={Paths.spacePath(space.id!)}>{space.name}</Paper.NavItem>
    </Paper.Navigation>
  );
}
