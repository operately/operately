import React from "react";

import { useLocation } from "react-router-dom";
import { useNavigateTo } from "@/routes/useNavigateTo";

import { Outlet } from "react-router-dom";
import { User } from "./User";
import { Bell } from "./Bell";
import { AdminLink } from "./AdminLink";
import { Logo } from "./Logo";

function NavigationContainer({ children }) {
  return <div className="fixed top-0 left-0 right-0 transition-all z-50 py-1.5">{children}</div>;
}

function Navigation() {
  const goToLobby = useNavigateTo("/");

  return (
    <NavigationContainer>
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={goToLobby}>
            <Logo />
            <div className="font-semibold">Operately</div>
          </div>
        </div>
        <div className="flex-1"></div>

        <div className="flex items-center gap-2 flex-row-reverse">
          <User />
          <Bell />
          <AdminLink />
        </div>
      </div>
    </NavigationContainer>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  React.useEffect(() => {
    // "document.documentElement.scrollTo" is the magic for React Router Dom v6
    document.documentElement.scrollTo({
      top: 0,
      left: 0,
    });
  }, [pathname]);

  return null;
}

export default function DefaultLayout() {
  return (
    <div className="">
      <ScrollToTop />
      <Navigation />
      <Outlet />
    </div>
  );
}
