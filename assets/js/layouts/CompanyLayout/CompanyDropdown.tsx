import * as React from "react";
import * as Icons from "@tabler/icons-react";
import * as Companies from "@/models/companies";

import { Paths } from "@/routes/paths";
import { DropdownMenu, DropdownLinkItem, DropdownSeparator } from "./DropdownMenu";

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
        path={Paths.feedPath()}
        icon={Icons.IconRss}
        title="The Feed"
        testId="company-dropdown-company-feed"
      />
      <DropdownLinkItem
        path={Paths.peoplePath()}
        icon={Icons.IconUserCircle}
        title="People"
        testId="company-dropdown-people"
      />
      <DropdownLinkItem
        path={Paths.orgChartPath()}
        icon={Icons.IconBinaryTree2}
        title="Org Chart"
        testId="company-dropdown-org-chart"
      />

      <DropdownSeparator />

      <DropdownLinkItem
        path={Paths.companyAdminPath()}
        icon={Icons.IconCircleKey}
        title="Company Admin"
        testId="company-dropdown-company-admin"
      />
      <DropdownLinkItem
        path={Paths.lobbyPath()}
        icon={Icons.IconSwitch}
        title="Switch Company"
        testId="company-dropdown-switch"
      />
    </DropdownMenu>
  );
}
