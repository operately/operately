import React from "react";
import { useTranslation } from "react-i18next";

import { IconBinaryTree2, IconBuildingEstate, IconCircleKey, IconSwitch, IconUserCircle } from "../icons";
import { CompanyNavigationLinks } from "./types";
import { DropdownLinkItem, DropdownMenu, DropdownSeparator } from "./DropdownMenu";
import { truncateCompanyName } from "./truncateCompanyName";

export function CompanyDropdown({
  companyName,
  links,
  canViewCompanyDirectory,
}: {
  companyName: string;
  links: CompanyNavigationLinks;
  canViewCompanyDirectory: boolean;
}) {
  const { t } = useTranslation();
  const displayName = truncateCompanyName(companyName);

  return (
    <DropdownMenu
      testId="company-dropdown"
      name={displayName}
      title={displayName === companyName ? undefined : companyName}
      icon={IconBuildingEstate}
      align="start"
      showDropdownIcon
    >
      <DropdownLinkItem
        path={links.people}
        icon={IconUserCircle}
        title={t("People")}
        testId="company-dropdown-people"
        hidden={!canViewCompanyDirectory}
      />
      <DropdownLinkItem
        path={links.orgChart}
        icon={IconBinaryTree2}
        title={t("Org Chart")}
        testId="company-dropdown-org-chart"
        hidden={!canViewCompanyDirectory}
      />

      <DropdownSeparator />

      <DropdownLinkItem
        path={links.companyAdmin}
        icon={IconCircleKey}
        title={t("Company Admin")}
        testId="company-dropdown-company-admin"
      />
      <DropdownLinkItem path={links.lobby} icon={IconSwitch} title={t("Switch Company")} testId="company-dropdown-switch" />
    </DropdownMenu>
  );
}
