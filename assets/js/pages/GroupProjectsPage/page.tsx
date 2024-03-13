import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Projects from "@/models/projects";
import * as Icons from "@tabler/icons-react";

import { FilledButton } from "@/components/Button";
import { GroupPageNavigation } from "@/components/GroupPageNavigation";

import { createPath } from "@/utils/paths";
import { useLoadedData } from "./loader";
import { ProjectListItem } from "@/features/ProjectListItem";
import classNames from "classnames";

export function Page() {
  const { group, projects } = useLoadedData();
  const newProjectPath = createPath("spaces", group.id, "projects", "new");

  return (
    <Pages.Page title={group.name}>
      <Paper.Root size="large">
        <Paper.Body minHeight="500px" backgroundColor="bg-surface">
          <GroupPageNavigation group={group} activeTab="projects" />

          <div className="flex items-center justify-between mb-8">
            <div className="font-extrabold text-3xl">Projects</div>
            <FilledButton type="primary" testId="add-project" size="sm" linkTo={newProjectPath}>
              Add Project
            </FilledButton>
          </div>

          <ProjectList projects={projects} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function ProjectList({ projects }: { projects: Projects.Project[] }) {
  const activeProjects = Projects.sortByName(
    projects.filter((p) => !p.isArchived && p.status !== "closed" && p.status !== "paused"),
  );
  const pausedProjects = Projects.sortByName(projects.filter((p) => p.status === "paused"));
  const closedProjects = [...projects.filter((p) => p.isArchived || p.status === "closed")].sort(
    (a, b) => b.closedAt - a.closedAt,
  );

  const [state, setState] = React.useState<"active" | "paused" | "closed">("active");

  const displayedProjects = state === "active" ? activeProjects : state === "paused" ? pausedProjects : closedProjects;

  return (
    <div className="bg-surface-dimmed p-1 rounded-lg shadow">
      <div className="rounded flex items-center gap-4 text-sm py-3 px-3">
        <StateSelector
          title="Active"
          count={activeProjects.length}
          active={state === "active"}
          onClick={() => setState("active")}
        />
        <StateSelector
          title="Paused"
          count={pausedProjects.length}
          active={state === "paused"}
          onClick={() => setState("paused")}
        />
        <StateSelector
          title="Closed"
          count={closedProjects.length}
          active={state === "closed"}
          onClick={() => setState("closed")}
        />
      </div>

      <div className="flex flex-col gap-1">
        {displayedProjects.map((project) => (
          <div key={project.id} className="px-3 py-4 bg-surface flex flex-col">
            <ProjectListItem project={project} key={project.id} avatarPosition="right" />
          </div>
        ))}
      </div>
    </div>
  );
}

<div className="font-medium">203 Closed</div>;

function StateSelector({ title, count, active, onClick }) {
  const className = classNames({
    "font-bold": active,
    "font-medium text-content-dimmed": !active,
    "cursor-pointer": true,
  });

  return (
    <div className={className} onClick={onClick}>
      {count} {title}
    </div>
  );
}
