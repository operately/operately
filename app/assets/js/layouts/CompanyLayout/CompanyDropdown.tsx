import * as Companies from "@/models/companies";
import * as Icons from "@tabler/icons-react";
import * as React from "react";

import { Paths, usePaths } from "@/routes/paths";
import { DropdownLinkItem, DropdownMenu, DropdownSeparator } from "./DropdownMenu";

export function CompanyDropdown({ company }: { company: Companies.Company }) {
  const paths = usePaths();

  return (
    <DropdownMenu
      testId="company-dropdown"
      name={company.name!}
      icon={Icons.IconBuildingEstate}
      align="start"
      showDropdownIcon
    >
      <DropdownLinkItem
        path={paths.feedPath()}
        icon={Icons.IconRss}
        title="The Feed"
        testId="company-dropdown-company-feed"
      />
      <DropdownLinkItem
        path={paths.peoplePath()}
        icon={Icons.IconUserCircle}
        title="People"
        testId="company-dropdown-people"
      />
      <DropdownLinkItem
        path={paths.orgChartPath()}
        icon={Icons.IconBinaryTree2}
        title="Org Chart"
        testId="company-dropdown-org-chart"
      />

      <DropdownSeparator />

      <DropdownLinkItem
        path={paths.companyAdminPath()}
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
