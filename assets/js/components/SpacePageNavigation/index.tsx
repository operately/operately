import React from "react";

import * as Icons from "@tabler/icons-react";
import * as PageOptions from "@/components/PaperContainer/PageOptions";
import * as Spaces from "@/models/spaces";
import * as Paper from "@/components/PaperContainer";

import { DivLink } from "@/components/Link";
import classnames from "classnames";
import { createTestId } from "@/utils/testid";
import classNames from "classnames";
import { Paths } from "@/routes/paths";

interface SpacePageNavigationProps {
  space: Spaces.Space;
  activeTab: "overview" | "discussions" | "goals" | "projects";
}

export function SpacePageNavigation({ space, activeTab }: SpacePageNavigationProps) {
  const { negTop, negHor } = Paper.usePaperSizeHelpers();

  const overviewPath = Paths.spacePath(space.id!);
  const goalsPath = Paths.spaceGoalsPath(space.id!);
  const projectsPath = Paths.spaceProjectsPath(space.id!);
  const discussionsPath = Paths.spaceDiscussionsPath(space.id!);

  const wrapperClassName = classNames(
    "mb-8 border-b border-surface-outline bg-surface-dimmed rounded-t",
    negHor,
    negTop,
  );

  return (
    <div className={wrapperClassName}>
      <div className="flex items-center justify-between">
        <div className="font-medium pl-4 text-sm w-3/12 truncate pt-1">{space.name}</div>

        <div className="flex items-center justify-center gap-2 flex-1 w-6/12">
          <Tab id="overview" activeTab={activeTab} link={overviewPath} title="Overview" />
          <Tab id="goals" activeTab={activeTab} link={goalsPath} title="Goals" />
          <Tab id="projects" activeTab={activeTab} link={projectsPath} title="Projects" />
          <Tab id="discussions" activeTab={activeTab} link={discussionsPath} title="Discussions" />
        </div>

        <div className="font-medium pr-3 flex justify-end items-center w-3/12">
          <Settings space={space} />
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

export function Settings({ space }) {
  return (
    <PageOptions.Root noBorder testId="space-settings">
      <PageOptions.Link
        icon={Icons.IconEdit}
        title="Edit name and purpose"
        to={Paths.spaceEditPath(space.id)}
        dataTestId="edit-name-and-purpose"
      />
      {!space.isCompanySpace && (
        <PageOptions.Link
          icon={Icons.IconLock}
          title="Edit space permissions"
          to={Paths.spaceEditPermissionsPath(space.id)}
          dataTestId="edit-space-permissions-button"
        />
      )}
      {!space.isCompanySpace && (
        <PageOptions.Link
          icon={Icons.IconUserPlus}
          title="Add/Remove members"
          to={Paths.spaceMembersPath(space.id)}
          dataTestId="add-remove-members"
        />
      )}
      <PageOptions.Link
        icon={Icons.IconPaint}
        title="Change Appearance"
        to={Paths.spaceAppearancePath(space.id)}
        dataTestId="change-appearance"
      />
    </PageOptions.Root>
  );
}
