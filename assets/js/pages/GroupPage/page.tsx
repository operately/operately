import React from "react";

import * as Companies from "@/models/companies";
import * as Pages from "@/components/Pages";
import * as Groups from "@/graphql/Groups";
import * as Icons from "@tabler/icons-react";

import MemberList from "./MemberList";
import { Link } from "@/components/Link";

import OptionsMenu from "./OptionsMenu";
import { GhostButton } from "@/components/Button";

import { useNavigate } from "react-router-dom";
import { useLoadedData } from "./loader";

export function Page() {
  const { company, group } = useLoadedData();

  return (
    <Pages.Page title={group.name}>
      <OptionsMenu group={group} />

      <div className="font-medium flex items-center gap-2 w-full justify-center mt-2" data-test-id="group-members">
        <MemberList group={group} />
      </div>

      <div className="max-w-screen-lg mx-auto w-[90%]">
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

        {Companies.hasFeature(company, "space-documents") && (
          <div className="flex items-start justify-center mb-8 border-t border-surface-outline pt-4">
            <div className="w-48">
              <div className="text-content-accent font-bold">Documents</div>
              <Link to={`/spaces/${group.id}/projects`}>Manage Documents</Link>
            </div>
            <div className="flex-1"></div>
          </div>
        )}

        {Companies.hasFeature(company, "space-calendar") && (
          <div className="flex items-start justify-center mb-8 border-t border-surface-outline pt-4">
            <div className="w-48">
              <div className="text-content-accent font-bold">Calendar</div>
              <Link to={`/spaces/${group.id}/projects`}>Manage Calendar</Link>
            </div>
            <div className="flex-1"></div>
          </div>
        )}

        {Companies.hasFeature(company, "goals") && (
          <div className="flex items-start justify-center mb-8 border-t border-surface-outline pt-4">
            <div className="w-48">
              <div className="text-content-accent font-bold">Goals</div>
              <Link to={`/spaces/${group.id}/projects`}>Manage Goals</Link>
            </div>
            <div className="flex-1"></div>
          </div>
        )}
      </div>
    </Pages.Page>
  );
}

import * as Projects from "@/graphql/Projects";
import Avatar from "@/components/Avatar";

function ProjectList({ group }: { group: Groups.Group }) {
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
