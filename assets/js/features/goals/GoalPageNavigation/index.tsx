import React from "react";

import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";
import * as Spaces from "@/models/spaces";
import { Paths } from "@/routes/paths";

export function Navigation({ space }: { space: Spaces.Space }) {
  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={Paths.spacePath(space.id!)}>
        {React.createElement(Icons[space.icon!], { size: 16, className: space.color })}
        {space.name}
      </Paper.NavItem>
    </Paper.Navigation>
  );
}
