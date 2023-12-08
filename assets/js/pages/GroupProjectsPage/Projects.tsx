import React from "react";

import * as Icons from "@tabler/icons-react";
import * as Projects from "@/graphql/Projects";

import { useNavigate } from "react-router-dom";

import { GhostButton } from "@/components/Button";
import { Group } from "@/gql/generated";
import Avatar from "@/components/Avatar";

export function ProjectsSection({ group }: { group: Group }) {
  return (
    <div className="mb-8 mt-8">
      <div className="flex items-center gap-4 w-full">
        <div className="text-content-accent font-bold text-lg">Projects</div>
        <div className="h-px bg-surface-outline flex-1"></div>
        <GhostButton type="primary" size="sm" linkTo={`/spaces/${group.id}/projects/new`} testId="add-project">
          Start a new Project
        </GhostButton>
      </div>

      <div className="flex-1 mt-4">
        <ProjectList group={group} />
      </div>
    </div>
  );
}

function ProjectList({ group }: { group: Group }) {
  const { data, loading, error } = Projects.useProjects({ groupId: group.id });

  if (loading) return null;
  if (error) return null;

  return <ProjectGrid projects={data?.projects} />;
}

function ProjectGrid({ projects }: { projects: Projects.Project[] }) {
  return (
    <div className="grid lg:grid-cols-3 md:grid-cols-3 sm:grid-cols-2 gap-4">
      {projects
        .filter((project) => !project.isArchived)
        .map((project) => {
          return <ProjectGridItem project={project} key={project.id} />;
        })}
    </div>
  );
}

function ProjectGridItem({ project }: { project: Projects.Project }) {
  const navigate = useNavigate();

  return (
    <div
      className="bg-surface rounded-lg p-4 flex flex-col gap-2 cursor-pointer shadow hover:shadow-lg overflow-hidden borderb border-surface-outline"
      onClick={() => navigate(`/projects/${project.id}`)}
    >
      <div className="flex flex-col justify-between h-28">
        <div>
          <div className="text-ellipsis font-bold">{project.name}</div>
          <NextMilestone project={project} />
        </div>

        <div className="flex items-center gap-1">
          {project.contributors!.map((contributor) => (
            <Avatar key={contributor!.id} person={contributor!.person} size="tiny" />
          ))}
        </div>
      </div>
    </div>
  );
}

function NextMilestone({ project }) {
  if (project.nextMilestone === null) {
    return <span className="text-sm text-content-dimmed">&mdash;</span>;
  } else {
    return (
      <div className="">
        <Icons.IconFlag3Filled size={16} className="text-yellow-400/80 inline mr-1" />{" "}
        <span className="">{project.nextMilestone.title}</span>
      </div>
    );
  }
}
