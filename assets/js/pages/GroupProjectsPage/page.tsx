import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";
import * as Milestones from "@/graphql/Projects/milestones";

import Avatar from "@/components/Avatar";
import { GroupPageNavigation } from "@/components/GroupPageNavigation";
import { useLoadedData } from "./loader";
import { createPath } from "@/utils/paths";
import classnames from "classnames";
import FormattedTime from "@/components/FormattedTime";
import { DivLink } from "@/components/Link";
import { MiniPieChart } from "@/components/MiniPieChart";

export function Page() {
  const { group, projects } = useLoadedData();

  return (
    <Pages.Page title={group.name}>
      <Paper.Root size="large">
        <Paper.Body minHeight="500px">
          <GroupPageNavigation groupId={group.id} groupName={group.name} activeTab="projects" />
          <ProjectList projects={projects} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function ProjectList({ projects }) {
  const activeProjects = projects.filter((project) => !project.isArchived);

  return (
    <div className="flex flex-col mt-8 border-y border-stroke-base rounded">
      {activeProjects.map((project) => {
        return <ProjectListItem project={project} key={project.id} />;
      })}
    </div>
  );
}

function ProjectListItem({ project }) {
  const path = createPath("projects", project.id);
  const className = classnames(
    "py-4 px-1",
    "bg-surface",
    "flex flex-col",
    "cursor-pointer",
    "hover:bg-surface-highlight",
    "border-stroke-base not-first:border-t first:rounded-t last:rounded-b",
  );

  let [pending, done] = Milestones.splitByCompletion(project.milestones);

  return (
    <DivLink to={path} className={className}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <MiniPieChart completed={done.length} total={pending + done.length} size={20} />

          <div className="-mt-1">
            <div className="text-ellipsis font-semibold">{project.name}</div>

            <div className="flex items-center gap-1">
              <DueDate project={project} />
              <span>&middot;</span>
              <NextMilestone project={project} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {project.contributors!.map((contributor) => (
            <Avatar key={contributor!.id} person={contributor!.person} size="tiny" />
          ))}
        </div>
      </div>
    </DivLink>
  );
}

function NextMilestone({ project }) {
  if (project.nextMilestone === null) {
    return <span className="text-sm text-content-subtle">no milestones</span>;
  } else {
    return (
      <div className="text-sm inline-flex items-center gap-1 text-content-dimmed">
        <Icons.IconFlagFilled size={14} />
        <span className="">{project.nextMilestone.title}</span>
      </div>
    );
  }
}

function DueDate({ project }) {
  if (project.deadline === null) {
    return <span className="text-sm text-content-subtle">no deadline</span>;
  } else {
    return (
      <div className="text-sm inline-flex items-center gap-1 text-content-dimmed">
        <span className="">
          <FormattedTime time={project.deadline} format="short-date" />
        </span>
      </div>
    );
  }
}
