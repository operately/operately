import React from "react";

import { Outlet } from "react-router-dom";

import User from "./User";
import { useLocation, NavLink } from "react-router-dom";

import * as Icons from "tabler-icons-react";

function Logo() {
  return (
    <svg
      id="Layer_1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1000 1000"
      width="36"
      height="36"
    >
      <polygon
        points="602.32 806.96 397.68 806.96 397.68 602.32 602.32 806.96"
        fill="rgba(255,255,255,0.5)"
      />
      <polygon
        points="397.68 193.04 602.32 193.04 602.32 397.68 397.68 193.04"
        fill="rgba(255,255,255,0.5)"
      />
      <polygon
        points="602.32 193.04 602.32 397.68 602.32 602.32 602.32 806.96 806.96 602.32 806.96 397.68 602.32 193.04"
        fill="rgba(255,255,255,0.9)"
      />
      <polygon
        points="193.04 397.68 193.04 602.32 397.68 806.96 397.68 602.32 397.68 397.68 397.68 193.04 193.04 397.68"
        fill="rgba(255,255,255,0.9)"
      />
    </svg>
  );
}

function Flare() {
  return (
    <div
      className="absolute"
      style={{
        top: 0,
        left: 0,
        right: 0,
        height: "800px",
        background:
          "radial-gradient(circle at top, #ffff0010 0%, #00000000 50%)",
        pointerEvents: "none",
      }}
    ></div>
  );
}

function NavigationContainer({ size, children }) {
  const padding = size === "large" ? "py-3 px-4" : "py-1 px-4";

  return (
    <div
      className={
        "fixed top-0 left-0 right-0 backdrop-blur transition-all z-50" +
        " " +
        padding
      }
    >
      {children}
    </div>
  );
}

function NavigationItem({ to, title, icon }) {
  const baseClass = "flex items-center px-2 py-1";

  const classHandler = ({ isActive, isPending }) => {
    if (isActive || isPending) {
      return baseClass + "  bg-shade-1 rounded-lg text-white-1";
    } else {
      return baseClass + " text-white-2";
    }
  };

  return (
    <NavLink to={to} className={classHandler}>
      <span className="font-bold flex items-center gap-2">
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
        <div className="flex items-center">
          <div className="flex items-center gap-2">
            <div className="mr-4">
              <div className="flex items-center gap-1">
                <Logo />
                <span className="text-white-1 font-bold">Operately</span>
              </div>
            </div>

            <NavigationItem
              to="/company"
              title="Company"
              icon={<Icons.Building size={16} />}
            />
            <NavigationItem
              to="/goals"
              title="Goals"
              icon={<Icons.Target size={16} />}
            />
            <NavigationItem
              to="/projects"
              title="Projects"
              icon={<Icons.ClipboardText size={16} />}
            />
            <NavigationItem
              to="/groups"
              title="People"
              icon={<Icons.User size={16} />}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative text-white-2">
            <div className="top-0 bottom-0 flex items-center absolute left-2">
              <Icons.Search size={16} />
            </div>
            <input
              type="text"
              className="bg-shade-1 rounded px-2 py-1 border border-shade-1 focus:w-96 focus:border-blue-400 focus:outline-none transition-all text-sm w-64 pl-8"
              placeholder="Search or jump to &hellip;"
            />
          </div>

          <NavigationItem
            to="/"
            title="Inbox"
            icon={<Icons.Inbox size={16} />}
          />

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
        if (window.pageYOffset > 50) {
          setNavigationSize("small");
        } else {
          setNavigationSize("large");
        }
      });
    }
  });

  return (
    <div>
      <ScrollToTop />
      <Navigation size={navigationSize} />

      <div>
        <Outlet />
      </div>
    </div>
  );
}
