import React from 'react';

import { Outlet } from 'react-router-dom';

import SideNavigation from '../../components/SideNavigation';
import User from './User';

export default function DefaultLayout() {
  return (
    <div>
      <SideNavigation />
      <div className="ml-72">
        <div className="m-11">
          <Outlet />
        </div>
      </div>

      <User />
    </div>
  );
}
