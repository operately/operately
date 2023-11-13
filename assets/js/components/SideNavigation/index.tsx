import React from "react";
import Link from "./Link";
import Icon from "../Icon";
import { useTranslation } from "react-i18next";

interface SideNavigationProps {
  isCollapsed: boolean;
  onCollapse: () => void;
}

function SideNavigation({ isCollapsed }: SideNavigationProps) {
  const { t } = useTranslation();

  return (
    <aside className="top-0 left-0 bottom-0 fixed flex w-72 bg-light-2 border-r border-[#E1E1E1] z-50">
      <div className="items-strech w-full mx-4">
        <div className="flex items-center justify-between mb-12 mt-7 ml-3">
          <img src="/assets/images/logo.svg" alt="Operately" />

          <div className="hover:cursor-pointer">
            <Icon name="sidebar collapse" color="dark-2" hoverColor="dark" />
          </div>
        </div>

        <ul
          className={`flex flex-col gap-2.5 list-none m-0 p-0 ${
            isCollapsed ? "hidden" : "block"
          }`}
        >
          <Link to="/objectives" title={t("Company")} icon="objectives" />
          <Link to="/projects" title={t("Projects")} icon="my projects" />
          <Link to="/spaces" title={t("Groups")} icon="groups" />
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
