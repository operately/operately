import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import { Paths } from "@/routes/paths";

export function NavigationBackToLobby() {
  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={Paths.homePath()}>Home</Paper.NavItem>
    </Paper.Navigation>
  );
}
