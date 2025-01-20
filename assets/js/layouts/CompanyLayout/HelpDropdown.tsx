import * as React from "react";
import * as Icons from "@tabler/icons-react";

import { Paths } from "@/routes/paths";
import { DropdownMenu, DropdownLinkItem, DropdownSeparator } from "./DropdownMenu";

export function HelpDropdown() {
  return (
    <DropdownMenu testId="help-dropdown" name="Help" icon={Icons.IconLifebuoy} align="center">
      <DropdownLinkItem path={Paths.newGoalPath()} icon={Icons.IconTargetArrow} title="New goal" />
      <DropdownLinkItem path={Paths.newProjectPath()} icon={Icons.IconTable} title="New project" />
      <DropdownSeparator />
      <DropdownLinkItem path={Paths.newSpacePath()} icon={Icons.IconTent} title="New space" />
      <DropdownSeparator />
      <DropdownLinkItem path={Paths.companyManagePeopleAddPeoplePath()} icon={Icons.IconUser} title="New team member" />
    </DropdownMenu>
  );
}
