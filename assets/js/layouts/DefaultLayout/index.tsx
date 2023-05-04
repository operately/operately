import React from "react";

import { Outlet } from "react-router-dom";

import SideNavigation from "../../components/SideNavigation";
import User from "./User";
import { Link } from "react-router-dom";

export default function DefaultLayout() {
  return (
    <div>
      <div className="flex justify-between fixed top-0 left-0 right-0 text-new-dark-3 px-4 py-4">
        <div className="flex items-center gap-4">
          <div className="font-semibold">Operately</div>
          <div className="bg-new-dark-2 rounded w-64 px-4 py-1.5 text-sm flex justify-between text-gray-500">
            <span>Search&hellip;</span>
            <span className="text-gray-500">⌘ K</span>
          </div>
          <Link to="/company" className="font-bold">
            Company
          </Link>
          <div className="font-bold text-gray-500">Timeline</div>
          <div className="font-bold text-gray-500">People & Groups</div>
        </div>

        <div className="flex items-center gap-4">
          <div className="font-bold text-gray-500">My Assignments</div>
          <User />
        </div>
      </div>

      <div className="text-new-dark-3">
        <Outlet />
      </div>
    </div>
  );
}
