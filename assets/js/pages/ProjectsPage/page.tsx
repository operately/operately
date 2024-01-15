import * as React from "react";
import type { ProjectGroup } from "@/models/projects/groupBySpace";

import * as Pages from "@/components/Pages";
import * as Projects from "@/models/projects";
import * as Icons from "@tabler/icons-react";

import Avatar from "@/components/Avatar";
import { TextTooltip } from "@/components/Tooltip";
import { Link } from "@/components/Link";
import { MiniPieChart } from "@/components/MiniPieChart";
import * as Milestones from "@/graphql/Projects/milestones";
import { Indicator } from "@/components/ProjectHealthIndicators";

import { useLoadedData, useFilters } from "./loader";
import { FilledButton } from "@/components/Button";
import classNames from "classnames";

export function Page() {
  const { projects } = useLoadedData();

  const ongoingProjects = projects.filter((project) => project.status === "active");
  const groups = Projects.groupBySpace(ongoingProjects);

  return (
    <Pages.Page title={"Projects"}>
      <div className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8 mt-10">
        <Filters />
        <Title />

        <div className="flex items-center justify-center mb-10 gap-4">
          <FilledButton linkTo={"/projects/new"}>Add Project</FilledButton>
        </div>

        <ProjectGroups groups={groups} />
      </div>
    </Pages.Page>
  );
}

function Title() {
  const { company, activeFilter } = useLoadedData();

  switch (activeFilter) {
    case "my-projects":
      return <h1 className="text-3xl font-bold text-center mb-6 leading-none">My projects in {company.name}</h1>;
    case "reviewed-by-me":
      return <h1 className="text-3xl font-bold text-center mb-6 leading-none">Reviewed by me in {company.name}</h1>;
    case "all-projects":
      return <h1 className="text-3xl font-bold text-center mb-6 leading-none">All projects in {company.name}</h1>;
  }
}

function Filters() {
  const { activeFilter } = useLoadedData();
  const { setFilter } = useFilters();

  return (
    <div className="flex items-center justify-center mb-6 gap-2">
      <div className="border border-stroke-base shadow text-sm font-medium rounded-full flex items-center bg-dark-8">
        <FilterButton onClick={() => setFilter("my-projects")} active={activeFilter === "my-projects"}>
          My Projects
        </FilterButton>
        <FilterButton onClick={() => setFilter("reviewed-by-me")} active={activeFilter === "reviewed-by-me"}>
          Reviewed by Me
        </FilterButton>
        <FilterButton onClick={() => setFilter("all-projects")} active={activeFilter === "all-projects"}>
          All Projects
        </FilterButton>
      </div>
    </div>
  );
}

function FilterButton({ onClick, children, active }) {
  const className = classNames(
    "px-3 py-1 text-sm font-medium rounded-full",
    active ? "bg-surface cursor-pointer" : "bg-transparent cursor-pointer text-white-1",
  );

  return (
    <div className={className} onClick={onClick}>
      {children}
    </div>
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
  const projects = Projects.sortByName(group.projects);

  return (
    <div className="flex flex-col gap-4">
      <div className="uppercase text-xs font-medium tracking-wide text-center flex items-center gap-4 w-full">
        <div className="h-px bg-stroke-base w-full" />
        <span className="whitespace-nowrap">{group.space.name}</span>
        <div className="h-px bg-stroke-base w-full" />
      </div>
      <ProjectList projects={projects} />
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
  let { pending, done } = Milestones.splitByStatus(project.milestones);
  const totalCount = pending.length + done.length;

  const completion = (
    <div className="flex items-center gap-2">
      <MiniPieChart completed={done.length} total={totalCount} size={16} />
      {done.length}/{totalCount} completed
    </div>
  );

  return (
    <div className="px-4 py-4 bg-surface border border-stroke-base shadow rounded">
      <div className="font-bold flex items-center gap-2 mb-2">
        <Link underline={false} to={`/projects/${project.id}`}>
          {project.name}
        </Link>
        <PrivateIndicator project={project} />
      </div>

      <div className="flex items-center gap-5 mt-2 text-sm">
        <Status project={project} />
        {totalCount > 0 && completion}
        <NextMilestone project={project} />
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

function NextMilestone({ project }) {
  if (project.nextMilestone === null) return null;

  return (
    <div className="inline-flex items-center gap-2">
      <Icons.IconFlagFilled size={16} className="text-green-600" />
      <span className="">{project.nextMilestone.title}</span>
    </div>
  );
}

function Status({ project }) {
  return <Indicator value={project.health} type="status" />;
}
