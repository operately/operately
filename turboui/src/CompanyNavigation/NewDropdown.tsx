import React from "react";
import { useTranslation } from "react-i18next";

import { IconPlus, IconTable, IconTargetArrow, IconTent, IconUser } from "../icons";
import { CompanyNavigationLinks } from "./types";
import { DropdownLinkItem, DropdownMenu, DropdownSeparator } from "./DropdownMenu";

export function NewDropdown({
  links,
  canAddGoal,
  canAddProject,
  canAddSpace,
  canInvitePeople,
}: {
  links: CompanyNavigationLinks;
  canAddGoal: boolean;
  canAddProject: boolean;
  canAddSpace: boolean;
  canInvitePeople: boolean;
}) {
  const { t } = useTranslation();

  return (
    <DropdownMenu testId="new-dropdown" name={t("New")} icon={IconPlus} align="end" triggerClassName="hidden lg:flex">
      <DropdownLinkItem
        path={links.newGoal}
        icon={IconTargetArrow}
        title={t("New goal")}
        testId="new-dropdown-new-goal"
        hidden={!canAddGoal}
      />

      <DropdownLinkItem
        path={links.newProject}
        icon={IconTable}
        title={t("New project")}
        testId="new-dropdown-new-project"
        hidden={!canAddProject}
      />

      <DropdownSeparator hidden={!canAddSpace} />

      <DropdownLinkItem
        path={links.newSpace}
        icon={IconTent}
        title={t("New space")}
        testId="new-dropdown-new-space"
        hidden={!canAddSpace}
      />

      <DropdownSeparator hidden={!canInvitePeople} />

      <DropdownLinkItem
        path={links.invitePeople}
        icon={IconUser}
        title={t("Invite people")}
        testId="new-dropdown-new-team-member"
        hidden={!canInvitePeople}
      />
    </DropdownMenu>
  );
}
