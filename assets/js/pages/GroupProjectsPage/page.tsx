import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Milestones from "@/graphql/Projects/milestones";
import * as Icons from "@tabler/icons-react";
import * as Projects from "@/models/projects";

import Avatar from "@/components/Avatar";
import { GhostButton } from "@/components/Button";
import { GroupPageNavigation } from "@/components/GroupPageNavigation";
import { Link } from "@/components/Link";
import { MiniPieChart } from "@/components/MiniPieChart";
import { createPath } from "@/utils/paths";
import classnames from "classnames";
import { useLoadedData } from "./loader";
import { Indicator } from "@/components/ProjectHealthIndicators";
import { TextTooltip } from "@/components/Tooltip";

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
    <div className="">
      {activeProjects.map((project) => {
        return <ProjectListItem project={project} key={project.id} />;
      })}
    </div>
  );
}

function PrivateIndicator({ project }) {
  if (!project.private) return null;

  return (
    <TextTooltip text="Private project. Visible only to contributors.">
      <div data-test-id="private-project-indicator">
        <Icons.IconLock size={16} />
      </div>
    </TextTooltip>
  );
}

function ProjectListItem({ project }) {
  const path = createPath("projects", project.id);
  const className = classnames("py-5", "bg-surface", "flex flex-col", "border-t last:border-b border-stroke-base");

  let { pending, done } = Milestones.splitByStatus(project.milestones);
  const totalCount = pending.length + done.length;

  const completion = (
    <div className="flex items-center gap-2">
      <MiniPieChart completed={done.length} total={totalCount} size={16} />
      {done.length}/{totalCount} completed
    </div>
  );

  const name = (
    <div className="font-extrabold flex items-center gap-2">
      <Link to={path} underline={false}>
        {project.name}
      </Link>

      <PrivateIndicator project={project} />
    </div>
  );

  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-2">
          <div className="">
            {name}

            <div className="flex items-center gap-5 mt-2 text-sm">
              <Status project={project} />
              {totalCount > 0 && completion}
              <NextMilestone project={project} />
            </div>
          </div>
        </div>

        <ContribList project={project} />
      </div>
    </div>
  );
}

function Status({ project }) {
  return <Indicator value={project.health} type="status" />;
}

function NextMilestone({ project }) {
  if (project.nextMilestone === null) return null;

  return (
    <div className="inline-flex items-center gap-2">
      <Icons.IconFlag3Filled size={16} />
      <span className="">{project.nextMilestone.title}</span>
    </div>
  );
}

function ContribList({ project }) {
  const sortedContributors = Projects.sortContributorsByRole(project.contributors as Projects.ProjectContributor[]);

  return (
    <div className="flex items-center gap-1">
      {sortedContributors.map((contributor) => (
        <Avatar key={contributor!.id} person={contributor!.person} size={24} />
      ))}
    </div>
  );
}
