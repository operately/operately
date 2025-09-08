import * as React from "react";

import { IconPlus, IconTargetArrow, IconTable, IconTent, IconUser } from "turboui";
import { DropdownLinkItem, DropdownMenu, DropdownSeparator } from "./DropdownMenu";

import { usePaths } from "@/routes/paths";
export function NewDropdown() {
  const paths = usePaths();
  return (
    <DropdownMenu testId="new-dropdown" name="New" icon={IconPlus} align="end">
      <DropdownLinkItem
        path={paths.newGoalPath()}
        icon={IconTargetArrow}
        title="New goal"
        testId="new-dropdown-new-goal"
      />

      <DropdownLinkItem
        path={paths.newProjectPath()}
        icon={IconTable}
        title="New project"
        testId="new-dropdown-new-project"
      />

      <DropdownSeparator />

      <DropdownLinkItem path={paths.newSpacePath()} icon={IconTent} title="New space" testId="new-dropdown-new-space" />

      <DropdownSeparator />

      <DropdownLinkItem
        path={paths.companyManagePeopleAddPeoplePath()}
        icon={IconUser}
        title="New team member"
        testId="new-dropdown-new-team-member"
      />
    </DropdownMenu>
  );
}
