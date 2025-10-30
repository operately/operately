import React from "react";

import { useMe } from "@/contexts/CurrentCompanyContext";
import { Avatar, Menu, MenuLinkItem, MenuActionItem, IconUserCircle, IconPalette, IconLockPassword, IconDoorExit } from "turboui";
import { logOut } from "@/routes/auth";

import { usePaths } from "@/routes/paths";

export function User() {
  const paths = usePaths();
  const me = useMe();

  if (!me) return null;

  const handleLogOut = async () => {
    const res = await logOut();

    if (res === "success") {
      window.location.href = "/";
    }
  };

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
    >
      <MenuLinkItem icon={IconUserCircle} to={paths.profileEditPath(me.id!)} testId="profile-link">
        Profile
      </MenuLinkItem>
      <MenuLinkItem icon={IconPalette} to={paths.accountAppearancePath()} testId="appearance-link">
        Appearance
      </MenuLinkItem>
      <MenuLinkItem icon={IconLockPassword} to={paths.accountSecurityPath()} testId="password-link">
        Password &amp; Security
      </MenuLinkItem>
      <MenuActionItem icon={IconDoorExit} onClick={handleLogOut} testId="log-out-button">
        Sign Out
      </MenuActionItem>
    </Menu>
  );
}
