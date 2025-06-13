import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";

import { useMe } from "@/contexts/CurrentCompanyContext";
import { logOut } from "@/routes/auth";
import { PageModule } from "@/routes/types";
import { BurgerActionsGroup, BurgerButton, BurgerLink } from "./BurgerActions";

export default { name: "AccountPage", loader: Pages.emptyLoader, Page } as PageModule;

function Page() {
  return (
    <Pages.Page title="My Account" testId="my-account-page">
      <Paper.Root size="small">
        <Paper.Body minHeight="500px">
          <Paper.Title>My Account</Paper.Title>

          <div className="flex flex-col gap-8">
            <BurgerActionsGroup>
              <ProfileLink />
              <AppearanceLink />
              <PasswordLink />
            </BurgerActionsGroup>

            <BurgerActionsGroup>
              <LogOutButton />
            </BurgerActionsGroup>
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function ProfileLink() {
  const me = useMe()!;

  return (
    <BurgerLink icon={Icons.IconUserCircle} to={DeprecatedPaths.profileEditPath(me.id!)} testId="profile-link">
      Profile
    </BurgerLink>
  );
}

function AppearanceLink() {
  return (
    <BurgerLink icon={Icons.IconPalette} to={DeprecatedPaths.accountAppearancePath()} testId="appearance-link">
      Appearance
    </BurgerLink>
  );
}

function PasswordLink() {
  return (
    <BurgerLink icon={Icons.IconLockPassword} to={DeprecatedPaths.accountSecurityPath()} testId="password-link">
      Password &amp; Security
    </BurgerLink>
  );
}

function LogOutButton() {
  const handleClick = async () => {
    const res = await logOut();

    if (res === "success") {
      window.location.href = "/";
    }
  };

  return (
    <BurgerButton onClick={handleClick} testId="log-out-button" icon={Icons.IconDoorExit}>
      Sign Out
    </BurgerButton>
  );
}
