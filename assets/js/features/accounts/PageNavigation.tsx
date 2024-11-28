import * as React from "react";
import * as Paper from "@/components/PaperContainer";

import Avatar from "@/components/Avatar";

import { useMe } from "@/contexts/CurrentCompanyContext";
import { Paths } from "@/routes/paths";

export function PageNavigation() {
  const me = useMe()!;

  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={Paths.accountPath()}>
        <Avatar person={me} size="tiny" />
        Account
      </Paper.NavItem>
    </Paper.Navigation>
  );
}
