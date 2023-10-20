import React from "react";

import * as Icons from "@tabler/icons-react";
import * as Paper from "@/components/PaperContainer";

import { logOut } from "@/graphql/Me";

import { PuffLoader } from "react-spinners";
import { Link } from "react-router-dom";

export async function loader(): Promise<null> {
  return null;
}

export function Page() {
  return (
    <Paper.Root size="small">
      <Paper.Body minHeight="500px">
        <Paper.Title>My Account</Paper.Title>

        <div className="flex flex-col gap-8">
          <div className="bg-dark-5 rounded-lg overflow-hidden divide-y divide-shade-2">
            <ProfileLink />
            <NotificationLink />
          </div>

          <div className="bg-dark-5 rounded-lg overflow-hidden">
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
      to="/account/profile"
      className="flex items-center gap-4 hover:bg-dark-7 cursor-pointer px-4 py-3 font-bold text-lg"
    >
      <Icons.IconUserCircle size={24} /> Profile
    </Link>
  );
}

function NotificationLink() {
  return (
    <Link
      to="/account/notifications"
      className="flex items-center gap-4 hover:bg-dark-7 cursor-pointer px-4 py-3 font-bold text-lg"
    >
      <Icons.IconBell size={24} /> Notifications
    </Link>
  );
}

function LogOutButton() {
  const [active, setActive] = React.useState(false);

  const handleClick = () => {
    console.log("logOut");
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
      className="flex items-center justify-between hover:bg-dark-7 cursor-pointer px-4 py-3 font-bold text-lg"
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
