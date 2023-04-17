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
    <aside className="h-screen sticky flex w-72">
      <div className="m-2 rounded bg-light-base items-strech w-full">
        <div className="flex items-center gap-1 mb-12 mx-2 mt-4">
          <Icon name="logo" />
          <span className="text-lg font-bold block">Operately</span>
        </div>

        <ul className={`list-none m-0 p-0 ${isCollapsed ? 'hidden' : 'block'}`}>
          <Link to="/objectives" title={t("Objectives")} icon={<Icon name="goal" />} />
          <Link to="/tenets" title={t("Tenets")} />
          <Link to="/projects" title={t("Projects")} />
          <Link to="/kpis" title={t("KPIs")} />
          <Link to="/groups" title={t("Groups")} icon={<Icon name="group" />} />
          <Link to="/people" title={t("People")} />
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
