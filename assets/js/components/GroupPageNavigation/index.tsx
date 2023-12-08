import React from "react";
import { DivLink } from "../Link";
import { createPath } from "@/utils/paths";
import * as Icons from "@tabler/icons-react";
import classnames from "classnames";

interface GroupPageNavigationProps {
  groupId: string;
  groupName: string;
  activeTab: "overview" | "discussions" | "goals" | "projects" | "kpis";
}

export function GroupPageNavigation({ groupId, groupName, activeTab }: GroupPageNavigationProps) {
  const overviewPath = createPath("groups", groupId);
  const goalsPath = createPath("groups", groupId, "goals");
  const projectsPath = createPath("groups", groupId, "projects");
  const discussionsPath = createPath("groups", groupId, "discussions");
  const kpisPath = createPath("groups", groupId, "kpis");

  return (
    <div className="-mx-16 -mt-12 mb-8 border-b border-surface-outline bg-surface-dimmed rounded-t">
      <div className="flex items-center justify-between">
        <div className="font-medium pl-4 text-sm w-3/12 truncate pt-1">{groupName}</div>

        <div className="flex items-center justify-center gap-2 flex-1 w-6/12">
          <Tab id="overview" activeTab={activeTab} link={overviewPath} title="Overview" />
          <Tab id="goals" activeTab={activeTab} link={goalsPath} title="Goals" />
          <Tab id="projects" activeTab={activeTab} link={projectsPath} title="Projects" />
          <Tab id="discussions" activeTab={activeTab} link={discussionsPath} title="Discussions" />
          <Tab id="kpis" activeTab={activeTab} link={kpisPath} title="KPIs" />
        </div>

        <div className="font-medium pr-3 flex justify-end items-center w-3/12">
          <Icons.IconDots size={16} className="text-content-dimmed" />
        </div>
      </div>
    </div>
  );
}

interface TabProps {
  id: string;
  activeTab: string;
  link: string;
  title: string;
}

function Tab({ id, activeTab, link, title }: TabProps) {
  let className = classnames("border-b-2 px-2 -mb-px py-1 pt-2");

  let active = classnames(className, "border-orange-500 font-bold cursor-default");

  let inactive = classnames(
    className,
    "border-transparent -mb-px text-content-dimmed",
    "hover:text-content hover:border-stroke-base",
  );

  if (activeTab === id) return <div className={active}>{title}</div>;

  return (
    <DivLink to={link} className={inactive}>
      {title}
    </DivLink>
  );
}
