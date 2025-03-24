import * as React from "react";
import * as Paper from "@/components/PaperContainer";

import { Paths } from "@/routes/paths";

export function PageNavigation() {
  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={Paths.accountPath()}>Account</Paper.NavItem>
    </Paper.Navigation>
  );
}
