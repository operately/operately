import React from "react";

import * as Icons from "@tabler/icons-react";
import * as PageOptions from "@/components/PaperContainer/PageOptions";
import * as Groups from "@/models/groups";
import * as Paper from "@/components/PaperContainer";

import { DivLink } from "@/components/Link";
import { createPath } from "@/utils/paths";
import classnames from "classnames";
import { createTestId } from "@/utils/testid";
import classNames from "classnames";

interface GroupPageNavigationProps {
  group: Groups.Group;
  activeTab: "overview" | "discussions" | "goals" | "projects";
}

export function GroupPageNavigation({ group, activeTab }: GroupPageNavigationProps) {
  const { negTop, negHor } = Paper.usePaperSizeHelpers();

  const overviewPath = createPath("spaces", group.id);
  const goalsPath = createPath("spaces", group.id, "goals");
  const projectsPath = createPath("spaces", group.id, "projects");
  const discussionsPath = createPath("spaces", group.id, "discussions");
  const wrapperClassName = classNames(
    "mb-8 border-b border-surface-outline bg-surface-dimmed rounded-t",
    negHor,
    negTop,
  );

  return (
    <div className={wrapperClassName}>
      <div className="flex items-center justify-between">
        <div className="font-medium pl-4 text-sm w-3/12 truncate pt-1">{group.name}</div>

        <div className="flex items-center justify-center gap-2 flex-1 w-6/12">
          <Tab id="overview" activeTab={activeTab} link={overviewPath} title="Overview" />
          <Tab id="goals" activeTab={activeTab} link={goalsPath} title="Goals" />
          <Tab id="projects" activeTab={activeTab} link={projectsPath} title="Projects" />
          <Tab id="discussions" activeTab={activeTab} link={discussionsPath} title="Discussions" />
        </div>

        <div className="font-medium pr-3 flex justify-end items-center w-3/12">
          <Settings group={group} />
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

export function Settings({ group }) {
  return (
    <PageOptions.Root noBorder testId="space-settings">
      <PageOptions.Link
        icon={Icons.IconEdit}
        title="Edit name and purpose"
        to={`/spaces/${group.id}/edit`}
        dataTestId="edit-name-and-purpose"
      />
      {!group.isCompanySpace && (
        <PageOptions.Link
          icon={Icons.IconUserPlus}
          title="Add/Remove members"
          to={`/spaces/${group.id}/members`}
          dataTestId="add-remove-members"
        />
      )}
      <PageOptions.Link
        icon={Icons.IconPaint}
        title="Change Appearance"
        to={`/spaces/${group.id}/appearance`}
        dataTestId="change-appearance"
      />
    </PageOptions.Root>
  );
}
