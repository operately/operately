import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Projects from "@/models/projects";

import { GhostButton } from "@/components/Button";
import { GroupPageNavigation } from "@/components/GroupPageNavigation";

import { createPath } from "@/utils/paths";
import { useLoadedData } from "./loader";
import { ProjectListItem } from "@/features/ProjectListItem";

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

function ProjectList({ projects }: { projects: Projects.Project[] }) {
  const activeProjects = projects.filter((project) => !project.isArchived);
  const sortedProjects = Projects.sortByName(activeProjects);

  return (
    <div className="">
      {sortedProjects.map((project) => (
        <div key={project.id} className="py-4 bg-surface flex flex-col border-t last:border-b border-stroke-base">
          <ProjectListItem project={project} key={project.id} avatarPosition="right" />
        </div>
      ))}
    </div>
  );
}
