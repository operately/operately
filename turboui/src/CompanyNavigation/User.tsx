import React from "react";

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
        Profile
      </MenuLinkItem>
      <MenuLinkItem icon={IconSettings} to={links.accountSettings} testId="settings-link">
        Settings
      </MenuLinkItem>
      <MenuLinkItem icon={IconLockPassword} to={links.accountSecurity} testId="password-link">
        Password &amp; Security
      </MenuLinkItem>
      <MenuLinkItem icon={IconCode} to={links.accountApiTokens} testId="api-tokens-link">
        API Tokens
      </MenuLinkItem>
      <MenuLinkItem icon={IconRobotFace} to={links.accountMcpConnections} testId="mcp-connections-link">
        MCP Connections
      </MenuLinkItem>
      <MenuActionItem icon={IconDoorExit} onClick={onLogOut} testId="log-out-button">
        Sign Out
      </MenuActionItem>
    </Menu>
  );
}
