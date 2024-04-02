import * as React from "react";
import * as Paper from "@/components/PaperContainer";

import { Paths } from "@/routes/paths";

export function PageNavigation() {
  const path = Paths.peoplePath();

  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={path}>People</Paper.NavItem>
    </Paper.Navigation>
  );
}
