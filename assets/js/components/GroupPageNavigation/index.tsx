import React from "react";

import * as Icons from "@tabler/icons-react";
import * as PageOptions from "@/components/PaperContainer/PageOptions";

import { DivLink } from "@/components/Link";
import { createPath } from "@/utils/paths";
import classnames from "classnames";
import { createTestId } from "@/utils/testid";

interface GroupPageNavigationProps {
  groupId: string;
  groupName: string;
  activeTab: "overview" | "discussions" | "goals" | "projects" | "kpis";
}

export function GroupPageNavigation({ groupId, groupName, activeTab }: GroupPageNavigationProps) {
  const overviewPath = createPath("spaces", groupId);
  const goalsPath = createPath("spaces", groupId, "goals");
  const projectsPath = createPath("spaces", groupId, "projects");
  const discussionsPath = createPath("spaces", groupId, "discussions");
  const kpisPath = createPath("spaces", groupId, "kpis");

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
          <Settings groupId={groupId} />
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

  let testId = createTestId(id, "tab");

  if (activeTab === id) return <div className={active}>{title}</div>;

  return (
    <DivLink to={link} className={inactive} testId={testId}>
      {title}
    </DivLink>
  );
}

export function Settings({ groupId }) {
  return (
    <PageOptions.Root noBorder>
      <PageOptions.Link
        icon={Icons.IconEdit}
        title="Edit name and purpose"
        to={`/spaces/${groupId}/edit`}
        dataTestId="edit-name-and-purpose"
      />
      <PageOptions.Link
        icon={Icons.IconUserPlus}
        title="Add/Remove members"
        to={`/spaces/${groupId}/members`}
        dataTestId="add-remove-members"
      />
      <PageOptions.Link
        icon={Icons.IconPaint}
        title="Change Appearance"
        to={`/spaces/${groupId}/appearance`}
        dataTestId="change-appearance"
      />
    </PageOptions.Root>
  );
}
