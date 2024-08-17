import React from "react";

import * as Icons from "@tabler/icons-react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { logOut } from "@/models/people";
import { Paths } from "@/routes/paths";
import { BurgerActionsGroup, BurgerLink, BurgerButton } from "./BurgerActions";

export const loader = Pages.emptyLoader();

export function Page() {
  return (
    <Pages.Page title="My Account" testId="my-account-page">
      <Paper.Root size="small">
        <Paper.Body minHeight="500px">
          <Paper.Title>My Account</Paper.Title>

          <div className="flex flex-col gap-8">
            <BurgerActionsGroup>
              <ProfileLink />
              <AppearanceLink />
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
  return (
    <BurgerLink icon={Icons.IconUserCircle} to={Paths.accountProfilePath()} testId="profile-link">
      Profile
    </BurgerLink>
  );
}

function AppearanceLink() {
  return (
    <BurgerLink icon={Icons.IconPalette} to={Paths.accountAppearancePath()} testId="appearance-link">
      Appearance
    </BurgerLink>
  );
}

function LogOutButton() {
  const handleClick = async () => {
    await logOut();
    window.location.href = "/";
  };

  return (
    <BurgerButton onClick={handleClick} testId="log-out-button" icon={Icons.IconDoorExit}>
      Sign Out
    </BurgerButton>
  );
}
