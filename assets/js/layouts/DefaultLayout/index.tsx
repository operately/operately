import React from "react";

import { Outlet } from "react-router-dom";

import User from "./User";
import Bell from "./Bell";

import { useLocation } from "react-router-dom";

import { useNavigateTo } from "@/routes/useNavigateTo";

import { createPath } from "@/utils/paths";
import { GhostButton } from "@/components/Button";

function Logo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      id="Layer_1"
      viewBox="193.04 193.04 613.92 613.92"
      width="22px"
      height="22px"
    >
      <polygon points="602.32 806.96 397.68 806.96 397.68 602.32 602.32 806.96" fill="#024fac"></polygon>
      <polygon points="397.68 193.04 602.32 193.04 602.32 397.68 397.68 193.04" fill="#024fac"></polygon>
      <polygon
        points="602.32 193.04 602.32 397.68 602.32 602.32 602.32 806.96 806.96 602.32 806.96 397.68 602.32 193.04"
        fill="#3185ff"
      ></polygon>
      <polygon
        points="193.04 397.68 193.04 602.32 397.68 806.96 397.68 602.32 397.68 397.68 397.68 193.04 193.04 397.68"
        fill="#3185ff"
      ></polygon>
    </svg>
  );
}

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

export function AdminLink() {
  const isRootPath = useLocation().pathname === "/";
  if (!isRootPath) return null;

  return (
    <div className="flex items-center justify-center">
      <GhostButton linkTo={createPath("company", "admin")} size="sm" type="secondary">
        <div className="font-bold">Company Admin</div>
      </GhostButton>
    </div>
  );
}
