import React from "react";
import ReactDOM from "react-dom";

import { Outlet } from "react-router-dom";

import User from "./User";
import { useLocation, NavLink } from "react-router-dom";

import * as Icons from "@tabler/icons-react";

function Logo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      id="Layer_1"
      viewBox="193.04 193.04 613.92 613.92"
      width="24px"
      height="24px"
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
  const padding = size === "large" ? "pt-2 pb-1.5 px-4" : "py-1 px-4";

  return (
    <div className={"fixed top-0 bg-dark-1 left-0 right-0 transition-all z-50 border-b border-shade-1" + " " + padding}>
      {children}
    </div>
  );
}

function NavigationItem({ to, title, icon }) {
  return (
    <NavLink to={to} className="flex items-center px-3 py-1">
      <span className="font-bold flex items-center gap-1">
        {icon}
        {title}
      </span>
    </NavLink>
  );
}

function Navigation({ size }) {
  return (
    <NavigationContainer size={size}>
      <div className="flex justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4">
            <Logo />
          </div>

          <div className="flex items-center gap-1">
            <NavigationItem to="/" title="Home" icon={<Icons.IconStarFilled size={16} stroke={3} />} />
            <NavigationItem to="/projects" title="Projects" icon={<Icons.IconTableFilled size={16} />} />
            <NavigationItem to="/groups" title="Groups" icon={<Icons.IconUsers size={16} stroke={3} />} />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="gap-4 flex items-center">
            <User />
          </div>
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
  const [navigationSize, setNavigationSize] = React.useState("large");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("scroll", () => {
        if (window.pageYOffset > 10) {
          setNavigationSize("small");
        } else {
          setNavigationSize("large");
        }
      });
    }
  });

  return (
    <div className="">
      <ScrollToTop />
      <Navigation size={navigationSize} />

      <Outlet />
    </div>
  );
}
