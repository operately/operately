import * as React from "react";
import * as Icons from "@tabler/icons-react";

import { Paths } from "@/routes/paths";
import { DropdownMenu, DropdownLinkItem, DropdownSeparator } from "./DropdownMenu";

export function NewDropdown() {
  return (
    <DropdownMenu testId="new-dropdown" name="New" icon={Icons.IconPlus} align="end">
      <DropdownLinkItem
        path={Paths.newGoalPath()}
        icon={Icons.IconTargetArrow}
        title="New goal"
        testId="new-dropdown-new-goal"
      />

      <DropdownLinkItem
        path={Paths.newProjectPath()}
        icon={Icons.IconTable}
        title="New project"
        testId="new-dropdown-new-project"
      />

      <DropdownSeparator />

      <DropdownLinkItem
        path={Paths.newSpacePath()}
        icon={Icons.IconTent}
        title="New space"
        testId="new-dropdown-new-space"
      />

      <DropdownSeparator />

      <DropdownLinkItem
        path={Paths.companyManagePeopleAddPeoplePath()}
        icon={Icons.IconUser}
        title="New team member"
        testId="new-dropdown-new-team-member"
      />
    </DropdownMenu>
  );
}
