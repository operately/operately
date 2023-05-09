import React from "react";

import { Outlet } from "react-router-dom";

import SideNavigation from "../../components/SideNavigation";
import User from "./User";
import { NavLink } from "react-router-dom";

export default function DefaultLayout() {
  const [small, setSmall] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("scroll", () => {
        console.log(window.pageYOffset);
        setSmall(window.pageYOffset > 50);
      });
    }
  });

  const classHandler = ({ isActive, isPending }) => {
    if (isActive || isPending) {
      return "font-bold";
    } else {
      return "font-semibold text-gray-500";
    }
  };

  return (
    <div>
      <div
        className={
          "flex justify-between fixed top-0 left-0 right-0 text-new-dark-3 px-4 backdrop-blur bg-transparent transition-all z-50 border-b border-new-dark-2" +
          (small
            ? " bg-new-dark-1/90 border-b border-new-dark-2 py-2"
            : " py-4 ")
        }
      >
        <div className="flex items-center gap-4">
          <NavLink to="/company" className="font-bold" children="Operately" />
          <div className="bg-new-dark-2 rounded w-64 px-4 py-1.5 text-sm flex justify-between text-gray-500">
            <span>Search&hellip;</span>
            <span className="text-gray-500">⌘ K</span>
          </div>

          <NavLink to="/company" className={classHandler} children="Company" />
          <NavLink
            to="/projects"
            className={classHandler}
            children="Timeline"
          />
          <NavLink
            to="/groups"
            className={classHandler}
            children="People & Groups"
          />
        </div>

        <div className="flex items-center gap-4">
          <NavLink to="/" className={classHandler} children="My Assingments" />
          <User />
        </div>
      </div>

      <div className="text-new-dark-3">
        <Outlet />
      </div>
    </div>
  );
}
