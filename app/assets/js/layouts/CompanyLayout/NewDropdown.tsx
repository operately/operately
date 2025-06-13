import * as Icons from "@tabler/icons-react";
import * as React from "react";

import { DropdownLinkItem, DropdownMenu, DropdownSeparator } from "./DropdownMenu";

export function NewDropdown() {
  return (
    <DropdownMenu testId="new-dropdown" name="New" icon={Icons.IconPlus} align="end">
      <DropdownLinkItem
        path={DeprecatedPaths.newGoalPath()}
        icon={Icons.IconTargetArrow}
        title="New goal"
        testId="new-dropdown-new-goal"
      />

      <DropdownLinkItem
        path={DeprecatedPaths.newProjectPath()}
        icon={Icons.IconTable}
        title="New project"
        testId="new-dropdown-new-project"
      />

      <DropdownSeparator />

      <DropdownLinkItem
        path={DeprecatedPaths.newSpacePath()}
        icon={Icons.IconTent}
        title="New space"
        testId="new-dropdown-new-space"
      />

      <DropdownSeparator />

      <DropdownLinkItem
        path={DeprecatedPaths.companyManagePeopleAddPeoplePath()}
        icon={Icons.IconUser}
        title="New team member"
        testId="new-dropdown-new-team-member"
      />
    </DropdownMenu>
  );
}
