import React from 'react';
import Link from './Link';
import { useTranslation } from "react-i18next";

import Icon from '../Icon';

interface SideNavigationProps {
  isCollapsed: boolean;
  onCollapse: () => void;
}

function SideNavigation({ isCollapsed }: SideNavigationProps) {
  const { t } = useTranslation();

  return (
    <aside className="top-0 left-0 bottom-0 fixed flex w-72 bg-light-2 border-r border-[#E1E1E1] z-50">
      <div className="items-strech w-full mx-5">
        <div className="flex items-center gap-1 mb-12 mt-4">
          <Icon name="logo" />
          <span className="text-lg font-bold block">Operately</span>
        </div>

        <ul className={`flex flex-col gap-2.5 list-none m-0 p-0 ${isCollapsed ? 'hidden' : 'block'}`}>
          <Link to="/objectives" title={t("Objectives")} icon={<Icon name="goal" />} />
          <Link to="/projects" title={t("Projects")} icon={<Icon name="project" />} />
          <Link to="/groups" title={t("Groups")} icon={<Icon name="group" />} />
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
