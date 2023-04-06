import React from 'react';

import SideNavigation from '../../components/SideNavigation';
import { Outlet } from 'react-router-dom';

export default function DefaultLayout() {
  return (
    <div className="flex">
      <SideNavigation />
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}
