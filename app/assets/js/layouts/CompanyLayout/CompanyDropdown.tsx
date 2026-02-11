import * as Companies from "@/models/companies";
import * as React from "react";

import { IconBuildingEstate, IconRss, IconUserCircle, IconBinaryTree2, IconCircleKey, IconSwitch } from "turboui";

import { useMe } from "@/contexts/CurrentCompanyContext";
import { Paths, usePaths } from "@/routes/paths";
import { DropdownLinkItem, DropdownMenu, DropdownSeparator } from "./DropdownMenu";

export function CompanyDropdown({ company }: { company: Companies.Company }) {
  const paths = usePaths();
  const me = useMe();
  const isGuest = me?.type === "guest";

  return (
    <DropdownMenu
      testId="company-dropdown"
      name={company.name!}
      icon={IconBuildingEstate}
      align="start"
      showDropdownIcon
    >
      <DropdownLinkItem
        path={paths.feedPath()}
        icon={IconRss}
        title="The Feed"
        testId="company-dropdown-company-feed"
      />
      <DropdownLinkItem
        path={paths.peoplePath()}
        icon={IconUserCircle}
        title="People"
        testId="company-dropdown-people"
        hidden={isGuest}
      />
      <DropdownLinkItem
        path={paths.orgChartPath()}
        icon={IconBinaryTree2}
        title="Org Chart"
        testId="company-dropdown-org-chart"
        hidden={isGuest}
      />

      <DropdownSeparator />

      <DropdownLinkItem
        path={paths.companyAdminPath()}
        icon={IconCircleKey}
        title="Company Admin"
        testId="company-dropdown-company-admin"
      />
      <DropdownLinkItem
        path={Paths.lobbyPath()}
        icon={IconSwitch}
        title="Switch Company"
        testId="company-dropdown-switch"
      />
    </DropdownMenu>
  );
}
