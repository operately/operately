import React from "react";
import { useTranslation } from "react-i18next";

import {
  IconBinaryTree2,
  IconBuildingEstate,
  IconCircleKey,
  IconPlus,
  IconShieldLock,
  IconSwitch,
  IconUserCircle,
} from "../icons";
import { CompanyNavigationLinks } from "./types";
import { DropdownLinkItem, DropdownMenu, DropdownSeparator } from "./DropdownMenu";
import { truncateCompanyName } from "./truncateCompanyName";

export function CompanyDropdown({
  companyName,
  companyCount,
  links,
  canViewCompanyDirectory,
  isSiteAdmin,
}: {
  companyName: string;
  companyCount?: number;
  links: CompanyNavigationLinks;
  canViewCompanyDirectory: boolean;
  isSiteAdmin: boolean;
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
        title={t("People", { context: "navigation" })}
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
      <DropdownLinkItem
        path={companyCount === 1 ? links.newCompany : links.lobby}
        icon={companyCount === 1 ? IconPlus : IconSwitch}
        title={companyCount === 1 ? t("Create Company") : t("Switch Company")}
        testId="company-dropdown-switch"
      />
      <DropdownLinkItem
        path={links.adminPanel}
        icon={IconShieldLock}
        title={t("Saas Admin Panel")}
        testId="company-dropdown-admin-panel"
        hidden={!isSiteAdmin}
      />
    </DropdownMenu>
  );
}
