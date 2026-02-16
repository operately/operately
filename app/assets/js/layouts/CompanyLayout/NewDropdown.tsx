import * as React from "react";

import { IconPlus, IconTargetArrow, IconTable, IconTent, IconUser } from "turboui";
import { DropdownLinkItem, DropdownMenu, DropdownSeparator } from "./DropdownMenu";

import { usePaths } from "@/routes/paths";

interface Props {
  canAddGoal: boolean;
  canAddProject: boolean;
  canAddSpace: boolean;
  canInvitePeople: boolean;
}

export function NewDropdown({ canAddGoal, canAddProject, canAddSpace, canInvitePeople }: Props) {
  const paths = usePaths();

  return (
    <DropdownMenu testId="new-dropdown" name="New" icon={IconPlus} align="end" triggerClassName="hidden lg:flex">
      <DropdownLinkItem
        path={paths.newGoalPath()}
        icon={IconTargetArrow}
        title="New goal"
        testId="new-dropdown-new-goal"
        hidden={!canAddGoal}
      />

      <DropdownLinkItem
        path={paths.newProjectPath()}
        icon={IconTable}
        title="New project"
        testId="new-dropdown-new-project"
        hidden={!canAddProject}
      />

      <DropdownSeparator hidden={!canAddSpace} />

      <DropdownLinkItem
        path={paths.newSpacePath()}
        icon={IconTent}
        title="New space"
        testId="new-dropdown-new-space"
        hidden={!canAddSpace}
      />

      <DropdownSeparator hidden={!canInvitePeople} />

      <DropdownLinkItem
        path={paths.invitePeoplePath()}
        icon={IconUser}
        title="Invite people"
        testId="new-dropdown-new-team-member"
        hidden={!canInvitePeople}
      />
    </DropdownMenu>
  );
}
