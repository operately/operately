import React from "react";
import { useTranslation } from "react-i18next";

import { Avatar } from "../Avatar";
import { IconCode, IconDoorExit, IconLockPassword, IconRobotFace, IconSettings, IconUserCircle } from "../icons";
import { Menu, MenuActionItem, MenuLinkItem } from "../Menu";
import { CompanyNavigationLinks, CompanyNavigationPerson } from "./types";

export function User({
  me,
  links,
  onLogOut,
}: {
  me: CompanyNavigationPerson;
  links: CompanyNavigationLinks;
  onLogOut: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Menu
      customTrigger={
        <div
          className="flex items-center cursor-pointer border border-stroke-base rounded-full"
          style={{ height: "32px", width: "32px" }}
        >
          <Avatar person={me} size={30} />
        </div>
      }
      testId="account-menu"
      showArrow
      headerContent={
        <div className="flex flex-col -mt-1.5">
          <div className="text-sm font-medium text-content-base">{me.fullName}</div>
          <div className="text-xs text-content-dimmed">{me.email}</div>
        </div>
      }
    >
      <MenuLinkItem icon={IconUserCircle} to={links.profileEdit} testId="profile-link">
        {t("Profile")}
      </MenuLinkItem>
      <MenuLinkItem icon={IconSettings} to={links.accountSettings} testId="settings-link">
        {t("Settings")}
      </MenuLinkItem>
      <MenuLinkItem icon={IconLockPassword} to={links.accountSecurity} testId="password-link">
        {t("Password & Security")}
      </MenuLinkItem>
      <MenuLinkItem icon={IconCode} to={links.accountApiTokens} testId="api-tokens-link">
        {t("API Tokens")}
      </MenuLinkItem>
      <MenuLinkItem icon={IconRobotFace} to={links.accountMcpConnections} testId="mcp-connections-link">
        {t("MCP Connections")}
      </MenuLinkItem>
      <MenuActionItem icon={IconDoorExit} onClick={onLogOut} testId="log-out-button">
        {t("Sign Out")}
      </MenuActionItem>
    </Menu>
  );
}
