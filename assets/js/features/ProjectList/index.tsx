import React from "react";

import * as Projects from "@/models/projects";
import * as Time from "@/utils/time";

import { ProjectListItem } from "@/features/ProjectListItem";
import classNames from "classnames";

interface ProjectListProps {
  projects: Projects.Project[];
  showSpace?: boolean;
}

export function ProjectList(props: ProjectListProps) {
  const viewState = useProjectListState(props.projects);

  return (
    <div className="bg-surface-dimmed p-1 rounded-lg shadow">
      <StateSelectors viewState={viewState} />

      <div className="flex flex-col gap-1">
        {viewState.displayedProjects.map((project) => (
          <div key={project.id} className="px-3 py-4 bg-surface flex flex-col">
            <ProjectListItem project={project} key={project.id} avatarPosition="right" showSpace={props.showSpace} />
          </div>
        ))}
      </div>
    </div>
  );
}

function useProjectListState(projects: Projects.Project[]) {
  const [state, setState] = React.useState<"active" | "paused" | "closed">("active");

  const nonArchived = projects.filter((p) => !p.isArchived);

  const activeProjects = Projects.sortByName(nonArchived.filter((p) => p.status !== "closed" && p.status !== "paused"));
  const pausedProjects = Projects.sortByName(nonArchived.filter((p) => p.status === "paused"));
  const closedProjects = Projects.sortByClosedAt(nonArchived.filter((p) => p.status === "closed"));

  const displayedProjects = state === "active" ? activeProjects : state === "paused" ? pausedProjects : closedProjects;

  return {
    state,
    setState,

    activeProjects,
    pausedProjects,
    closedProjects,

    displayedProjects,
  };
}

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

function StateSelectors({ viewState }) {
  return (
    <div className="rounded flex items-center gap-4 text-sm py-3 px-3">
      <StateSelector
        title="Active"
        count={viewState.activeProjects.length}
        active={viewState.state === "active"}
        onClick={() => viewState.setState("active")}
      />
      <StateSelector
        title="Paused"
        count={viewState.pausedProjects.length}
        active={viewState.state === "paused"}
        onClick={() => viewState.setState("paused")}
      />
      <StateSelector
        title="Closed"
        count={viewState.closedProjects.length}
        active={viewState.state === "closed"}
        onClick={() => viewState.setState("closed")}
      />
    </div>
  );
}
