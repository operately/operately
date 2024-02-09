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

export function Page() {
  const { group, projects } = useLoadedData();
  const newProjectPath = createPath("spaces", group.id, "projects", "new");

  return (
    <Pages.Page title={group.name}>
      <Paper.Root size="large" fluid>
        <Paper.Body minHeight="500px" backgroundColor="bg-surface">
          <GroupPageNavigation groupId={group.id} groupName={group.name} activeTab="projects" />

          <div className="-my-8 -mb-12 -mx-16 ">
            <div className="border-b">
              <div className="bg-surface-dimmed flex items-center justify-between px-2 py-8">
                <div className="font-extrabold text-3xl">Projects</div>
                <FilledButton type="primary" testId="add-project" size="sm" linkTo={newProjectPath}>
                  Add Project
                </FilledButton>
              </div>

              <div className="bg-surface-dimmed flex items-end justify-between text-xs font-bold px-4 py-2 border-t border-stroke-base">
                <div className="text-xs uppercase flex-1">Project</div>

                <div className="w-30 flex flex-col items-start mr-8">
                  <div className="text-xs mb-1 uppercase">Health</div>
                  <div className="flex items-center justify-center gap-1.5">
                    <div className="w-14 flex gap-1 font-medium">Budget</div>
                    <div className="w-14 flex gap-1 font-medium">Team</div>
                    <div className="w-14 flex gap-1 font-medium">Schedule</div>
                    <div className="w-14 flex gap-1 font-medium">Risks</div>
                  </div>
                </div>

                <div className="w-30 flex flex-col items-start mr-8">
                  <div className="text-xs mb-1 uppercase">Team</div>
                  <div className="flex items-center justify-center gap-1.5">
                    <div className="flex gap-1 font-medium">
                      <Icons.IconCrown size={14} />
                    </div>
                    <div className="flex gap-1 font-medium">
                      <Icons.IconEye size={14} />
                    </div>
                    <div className="flex gap-1 font-medium">
                      <Icons.IconUserCircle size={14} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <ProjectList projects={projects} />
          </div>
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
        <div
          key={project.id}
          className="py-2 px-4 bg-surface flex flex-col border-t last:border-b border-stroke-base last:rounded-b-lg"
        >
          <ProjectListItem project={project} key={project.id} avatarPosition="right" />
        </div>
      ))}
    </div>
  );
}
