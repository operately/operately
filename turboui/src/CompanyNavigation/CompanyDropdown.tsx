import React from "react";

import { IconBinaryTree2, IconBuildingEstate, IconCircleKey, IconSwitch, IconUserCircle } from "../icons";
import { CompanyNavigationLinks } from "./types";
import { DropdownLinkItem, DropdownMenu, DropdownSeparator } from "./DropdownMenu";

export function CompanyDropdown({
  companyName,
  links,
  canViewCompanyDirectory,
}: {
  companyName: string;
  links: CompanyNavigationLinks;
  canViewCompanyDirectory: boolean;
}) {
  return (
    <DropdownMenu testId="company-dropdown" name={companyName} icon={IconBuildingEstate} align="start" showDropdownIcon>
      <DropdownLinkItem
        path={links.people}
        icon={IconUserCircle}
        title="People"
        testId="company-dropdown-people"
        hidden={!canViewCompanyDirectory}
      />
      <DropdownLinkItem
        path={links.orgChart}
        icon={IconBinaryTree2}
        title="Org Chart"
        testId="company-dropdown-org-chart"
        hidden={!canViewCompanyDirectory}
      />

      <DropdownSeparator />

      <DropdownLinkItem
        path={links.companyAdmin}
        icon={IconCircleKey}
        title="Company Admin"
        testId="company-dropdown-company-admin"
      />
      <DropdownLinkItem path={links.lobby} icon={IconSwitch} title="Switch Company" testId="company-dropdown-switch" />
    </DropdownMenu>
  );
}
