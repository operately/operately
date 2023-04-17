import React from 'react';

import SideNavigation from '../../components/SideNavigation';
import { Outlet } from 'react-router-dom';

export default function DefaultLayout() {
  return (
    <div>
      <SideNavigation />
      <div className="ml-72">
        <div className="m-11">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
