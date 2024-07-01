import React from "react";

import * as Icons from "@tabler/icons-react";
import * as Paper from "@/components/PaperContainer";

import { logOut } from "@/models/people";

import { PuffLoader } from "react-spinners";
import { Link } from "react-router-dom";
import { Paths } from "@/routes/paths";

export async function loader(): Promise<null> {
  return null;
}

export function Page() {
  return (
    <Paper.Root size="small">
      <Paper.Body minHeight="500px">
        <Paper.Title>My Account</Paper.Title>

        <div className="flex flex-col gap-8">
          <div className="bg-surface-dimmed rounded-lg overflow-hidden divide-y divide-surface-outline border border-surface-outline">
            <ProfileLink />
            <AppearanceLink />
          </div>

          <div className="bg-surface-dimmed rounded-lg overflow-hidden border border-surface-outline">
            <LogOutButton />
          </div>
        </div>
      </Paper.Body>
    </Paper.Root>
  );
}

function ProfileLink() {
  return (
    <Link
      to={Paths.accountProfilePath()}
      className="flex items-center gap-4 hover:bg-surface-accent cursor-pointer px-4 py-3 font-bold text-lg"
    >
      <Icons.IconUserCircle size={24} /> Profile
    </Link>
  );
}

function AppearanceLink() {
  return (
    <Link
      to="/account/appearance"
      className="flex items-center gap-4 hover:bg-surface-accent cursor-pointer px-4 py-3 font-bold text-lg"
      data-test-id="appearance-link"
    >
      <Icons.IconPaint size={24} /> Appearance
    </Link>
  );
}

function LogOutButton() {
  const [active, setActive] = React.useState(false);

  const handleClick = () => {
    setActive(true);

    setTimeout(() => {
      logOut().then(() => {
        window.location.href = "/";
        setActive(false);
      });
    }, 500);
  };

  return (
    <div
      className="flex items-center justify-between hover:bg-surface-accent cursor-pointer px-4 py-3 font-bold text-lg"
      onClick={handleClick}
      data-test-id="log-out-button"
    >
      <div className="flex items-center gap-4">
        <Icons.IconDoorExit size={24} /> Sign Out
      </div>

      <PuffLoader size={24} color="#fff" loading={active} />
    </div>
  );
}
