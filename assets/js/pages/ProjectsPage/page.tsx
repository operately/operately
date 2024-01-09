import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Projects from "@/models/projects";

import { Link } from "@/components/Link";

import type { ProjectGroup } from "@/models/projects/groupBySpace";
import { useLoadedData } from "./loader";

import Avatar from "@/components/Avatar";

export function Page() {
  const { projects, company } = useLoadedData();

  const groups = Projects.groupBySpace(projects);

  return (
    <Pages.Page title={"Projects"}>
      <div className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8 mt-16">
        <h1 className="text-3xl font-bold text-center mt-2 mb-16">Projects in {company.name}</h1>

        <ProjectGroups groups={groups} />
      </div>
    </Pages.Page>
  );
}

function ProjectGroups({ groups }: { groups: ProjectGroup[] }) {
  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <ProjectGroup key={group.space.id} group={group} />
      ))}
    </div>
  );
}

function ProjectGroup({ group }: { group: ProjectGroup }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="uppercase text-xs font-medium tracking-wide text-center flex items-center gap-4 w-full">
        <div className="h-px bg-stroke-base w-full" />
        {group.space.name}
        <div className="h-px bg-stroke-base w-full" />
      </div>
      <ProjectList projects={group.projects} />
    </div>
  );
}

function ProjectList({ projects }: { projects: Projects.Project[] }) {
  return (
    <div className="flex flex-col gap-4">
      {projects.map((project) => (
        <ProjectListItem key={project.id} project={project} />
      ))}
    </div>
  );
}

function ProjectListItem({ project }: { project: Projects.Project }) {
  return (
    <div className="px-4 py-4 bg-surface border border-stroke-base shadow rounded">
      <div className="font-bold mb-2">
        <Link underline={false} to={`/projects/${project.id}`}>
          {project.name}
        </Link>
      </div>

      <div className="flex items-center gap-4 mt-4">
        <ContribList project={project} />
      </div>
    </div>
  );
}

function ContribList({ project }: { project: Projects.Project }) {
  const sortedContributors = [...project.contributors!].sort((a, b) => {
    if (a!.role === "champion") return -2;
    if (b!.role === "reviewer") return 1;

    return 0;
  });

  return (
    <div className="flex items-center gap-1">
      {sortedContributors.map((contributor) => (
        <Avatar key={contributor!.id} person={contributor!.person} size={20} />
      ))}
    </div>
  );
}
