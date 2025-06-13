import * as Companies from "@/models/companies";
import * as Icons from "@tabler/icons-react";
import * as React from "react";

import { DeprecatedPaths } from "@/routes/paths";
import { DropdownLinkItem, DropdownMenu, DropdownSeparator } from "./DropdownMenu";

export function CompanyDropdown({ company }: { company: Companies.Company }) {
  return (
    <DropdownMenu
      testId="company-dropdown"
      name={company.name!}
      icon={Icons.IconBuildingEstate}
      align="start"
      showDropdownIcon
    >
      <DropdownLinkItem
        path={DeprecatedPaths.feedPath()}
        icon={Icons.IconRss}
        title="The Feed"
        testId="company-dropdown-company-feed"
      />
      <DropdownLinkItem
        path={DeprecatedPaths.peoplePath()}
        icon={Icons.IconUserCircle}
        title="People"
        testId="company-dropdown-people"
      />
      <DropdownLinkItem
        path={DeprecatedPaths.orgChartPath()}
        icon={Icons.IconBinaryTree2}
        title="Org Chart"
        testId="company-dropdown-org-chart"
      />

      <DropdownSeparator />

      <DropdownLinkItem
        path={DeprecatedPaths.companyAdminPath()}
        icon={Icons.IconCircleKey}
        title="Company Admin"
        testId="company-dropdown-company-admin"
      />
      <DropdownLinkItem
        path={DeprecatedPaths.lobbyPath()}
        icon={Icons.IconSwitch}
        title="Switch Company"
        testId="company-dropdown-switch"
      />
    </DropdownMenu>
  );
}
