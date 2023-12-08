import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Milestones from "@/graphql/Projects/milestones";
import * as Icons from "@tabler/icons-react";

import Avatar from "@/components/Avatar";
import { GhostButton } from "@/components/Button";
import { GroupPageNavigation } from "@/components/GroupPageNavigation";
import { DivLink } from "@/components/Link";
import { MiniPieChart } from "@/components/MiniPieChart";
import { createPath } from "@/utils/paths";
import classnames from "classnames";
import { useLoadedData } from "./loader";

export function Page() {
  const { group, projects } = useLoadedData();
  const newProjectPath = createPath("spaces", group.id, "projects", "new");

  return (
    <Pages.Page title={group.name}>
      <Paper.Root size="large">
        <Paper.Body minHeight="500px" backgroundColor="bg-surface">
          <GroupPageNavigation groupId={group.id} groupName={group.name} activeTab="projects" />

          <div className="flex items-center justify-between mb-8">
            <div className="font-extrabold text-3xl">Projects</div>
            <GhostButton type="primary" testId="add-project" size="sm" linkTo={newProjectPath}>
              Add Project
            </GhostButton>
          </div>

          <ProjectList projects={projects} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function ProjectList({ projects }) {
  const activeProjects = projects.filter((project) => !project.isArchived);

  return (
    <div className="grid grid-cols-2 border-r border-b border-stroke-base">
      {activeProjects.map((project) => {
        return <ProjectListItem project={project} key={project.id} />;
      })}
    </div>
  );
}

function ProjectListItem({ project }) {
  const path = createPath("projects", project.id);
  const className = classnames(
    "py-3 px-3",
    "bg-surface",
    "flex flex-col",
    "cursor-pointer",
    "hover:bg-surface-highlight",
    "border-t border-l border-stroke-base",
  );

  let { pending, done } = Milestones.splitByStatus(project.milestones);

  const completion = (
    <div className="text-xs text-content-dimmed">
      {done.length}/{pending.length + done.length} completed
    </div>
  );
  const name = <div className="text-ellipsis font-bold text-lg">{project.name}</div>;

  return (
    <DivLink to={path} className={className}>
      <div className="flex items-start justify-between h-full">
        <div className="flex flex-col justify-between h-full">
          <div className="flex-1">
            {completion}
            {name}
            <NextMilestone project={project} pending={pending} done={done} />
          </div>

          <ContribList project={project} />
        </div>

        <MiniPieChart completed={done.length} total={pending.length + done.length} size={24} />
      </div>
    </DivLink>
  );
}

function NextMilestone({ project, pending, done }) {
  if (project.nextMilestone === null) return null;

  return (
    <div className="text-sm inline-flex items-center gap-1 text-content-dimmed">
      <Icons.IconFlag size={16} />
      <span className="">{project.nextMilestone.title}</span>
    </div>
  );
}

function ContribList({ project }) {
  return (
    <div className="flex items-center gap-1 mt-4">
      {project.contributors!.map((contributor) => (
        <Avatar key={contributor!.id} person={contributor!.person} size="tiny" />
      ))}
    </div>
  );
}
