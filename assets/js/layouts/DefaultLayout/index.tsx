import React from "react";

import { Outlet } from "react-router-dom";

import User from "./User";
import Bell from "./Bell";

import { useLocation, NavLink } from "react-router-dom";

import * as Icons from "@tabler/icons-react";

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

function NavigationContainer({ size, children }) {
  return (
    <div className="fixed top-0 bg-base left-0 right-0 transition-all z-50 border-b border-shade-2 py-1.5">
      {children}
    </div>
  );
}

function NavigationItem({ to, title, icon }) {
  return (
    <NavLink to={to} className="flex items-center">
      <span className="font-bold flex items-center gap-1 text-content-dimmed hover:text-content-accent transition-all">
        {icon}
        {title}
      </span>
    </NavLink>
  );
}

function Navigation({ size }) {
  return (
    <NavigationContainer size={size}>
      <div className="flex justify-between mx-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4">
            <Logo />
          </div>

          <div className="flex items-center ml-2">
            <NavigationItem to="/" title="Home" />
            <VerticalDivider />
            <NavigationItem to="/projects" title="Projects" />
            <VerticalDivider />
            <NavigationItem to="/groups" title="Groups" />
            <VerticalDivider />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <Bell />
            <VerticalDivider />
            <User />
          </div>
        </div>
      </div>
    </NavigationContainer>
  );
}

function VerticalDivider() {
  return <div className="w-px h-10 mx-2" />;
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
  const [navigationSize, setNavigationSize] = React.useState("large");

  React.useEffect(() => {
    window.addEventListener("scroll", () => {
      if (window.pageYOffset > 10) {
        setNavigationSize("small");
      } else {
        setNavigationSize("large");
      }
    });
  });

  return (
    <div className="">
      <ScrollToTop />
      <Navigation size={navigationSize} />

      <Outlet />
    </div>
  );
}
