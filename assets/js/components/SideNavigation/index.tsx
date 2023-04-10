import React from 'react';
import Link from './Link';

interface SideNavigationProps {
  isCollapsed: boolean;
  onCollapse: () => void;
}

function SideNavigation({ isCollapsed }: SideNavigationProps) {
  return (
    <aside className="h-screen sticky flex w-72">
      <div className="m-2 rounded bg-light-base items-strech w-full">
        <ul className={`list-none m-0 p-0 ${isCollapsed ? 'hidden' : 'block'}`}>
          <Link to="/objectives" title="Objectives" />
          <Link to="/tenets" title="Tenets" />
          <Link to="/projects" title="Projects" />
          <Link to="/kpis" title="KPIs" />
          <Link to="/groups" title="Groups" />
          <Link to="/people" title="People" />
        </ul>
      </div>
    </aside>
  );
}

SideNavigation.defaultProps = {
  isCollapsed: false,
  onCollapse: () => {},
};

export default SideNavigation;
