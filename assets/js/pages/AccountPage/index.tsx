import React from "react";

import * as Icons from "@tabler/icons-react";
import * as Paper from "@/components/PaperContainer";

import { logOut } from "@/graphql/Me";

import { PuffLoader } from "react-spinners";

export function AccountPage() {
  return (
    <Paper.Root size="small">
      <Paper.Body minHeight="500px">
        <Paper.Title>My Account</Paper.Title>

        <div className="m-16 flex flex-col gap-8">
          <div className="bg-dark-5 rounded-lg overflow-hidden divide-y divide-shade-2">
            <div className="flex items-center gap-4 hover:bg-dark-7 cursor-pointer px-4 py-3 font-bold text-lg">
              <Icons.IconUserCircle size={24} /> Profile
            </div>

            <div className="flex items-center gap-4 hover:bg-dark-7 cursor-pointer px-4 py-3 font-bold text-lg">
              <Icons.IconBell size={24} /> Notifications
            </div>
          </div>

          <div className="bg-dark-5 rounded-lg overflow-hidden">
            <LogOutButton />
          </div>
        </div>
      </Paper.Body>
    </Paper.Root>
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
      className="flex items-center justify-between hover:bg-dark-7 cursor-pointer px-4 py-3 font-bold text-lg"
      onClick={handleClick}
    >
      <div className="flex items-center gap-4">
        <Icons.IconDoorExit size={24} /> Sign Out
      </div>

      <PuffLoader size={24} color="#fff" loading={active} />
    </div>
  );
}
