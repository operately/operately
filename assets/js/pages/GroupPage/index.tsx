import React from "react";

import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Groups from "@/graphql/Groups";
import * as Icons from "@tabler/icons-react";

import client from "@/graphql/client";
import { useNavigate } from "react-router-dom";

import MemberList from "./MemberList";
import { Link, DimmedLink } from "@/components/Link";

import OptionsMenu from "./OptionsMenu";

interface LoadedData {
  group: Groups.Group;
}

export async function loader({ params }): Promise<LoadedData> {
  const groupData = await client.query({
    query: Groups.GET_GROUP,
    variables: { id: params.id },
    fetchPolicy: "network-only",
  });

  return { group: groupData.data.group };
}

export function Page() {
  const [{ group }] = Paper.useLoadedData() as [LoadedData, () => void];

  return (
    <Pages.Page title={group.name}>
      <OptionsMenu group={group} />

      <div className="font-medium flex items-center gap-2 w-full justify-center mt-2">
        <MemberList group={group} />
      </div>

      <div className="max-w-screen-lg mx-auto w-[90%]">
        <div className="uppercase font-medium text-content-accent text-xs mt-8 mb-2 tracking-wide">
          Tools and Resources for {group.name}
        </div>

        <div className="flex items-start justify-center mb-8 border-t border-surface-outline pt-4">
          <div className="w-48">
            <div className="text-content-accent font-bold">Documents</div>
            <Link to={`/groups/${group.id}/projects`}>Manage Calendar</Link>
          </div>
          <div className="flex-1"></div>
        </div>

        <div className="flex items-start justify-center mb-8 border-t border-surface-outline pt-4">
          <div className="w-48">
            <div className="text-content-accent font-bold">Calendar</div>
            <Link to={`/groups/${group.id}/projects`}>Manage Calendar</Link>
          </div>
          <div className="flex-1"></div>
        </div>

        <div className="flex items-start justify-center mb-8 border-t border-surface-outline pt-4">
          <div className="w-48">
            <div className="text-content-accent font-bold">Goals</div>
            <Link to={`/groups/${group.id}/projects`}>Manage Goals</Link>
          </div>
          <div className="flex-1"></div>
        </div>

        <div className="flex items-start justify-center mb-8 border-t border-surface-outline pt-4">
          <div className="w-48">
            <div className="text-content-accent font-bold">Projects</div>
            <Link to={`/groups/${group.id}/projects`}>Manage Projects</Link>
          </div>

          <div className="flex-1">
            <ProjectList group={group} />

            <div className="flex mt-4">
              <DimmedLink>See Archived Projects</DimmedLink>
            </div>
          </div>
        </div>
      </div>
    </Pages.Page>
  );
}

import * as Projects from "@/graphql/Projects";
import Avatar from "@/components/Avatar";

function ProjectList({ group }: { group: Groups.Group }) {
  const { data, loading, error } = Projects.useProjects({
    groupId: group.id,
    groupMemberRoles: ["champion"],
    limitContributorsToGroupMembers: true,
  });

  if (loading) return null;
  if (error) return null;

  return <ProjectGrid projects={data?.projects} />;
}

function ProjectGrid({ projects }: { projects: Projects.Project[] }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {projects
        .filter((project) => !project.isArchived)
        .map((project) => {
          return <ProjectGridItem project={project} key={project.id} />;
        })}
    </div>
  );
}

function ProjectGridItem({ project }: { project: Project }) {
  const navigate = useNavigate();

  return (
    <div
      className="bg-surface rounded-lg p-4 flex flex-col gap-2 cursor-pointer shadow-lg hover:shadow-xl overflow-hidden"
      onClick={() => navigate(`/projects/${project.id}`)}
    >
      <div className="flex flex-col justify-between h-20">
        <div>
          <div className="text-ellipsis font-bold text-sm">{project.name}</div>
          <NextMilestone project={project} />
        </div>

        <div className="flex items-center gap-2">
          {project.contributors.map((contributor) => (
            <Avatar key={contributor.id} person={contributor.person} size="tiny" />
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
      <div className="text-sm">
        <Icons.IconFlag3Filled size={14} className="text-yellow-400/80 inline mr-1" />{" "}
        <span className="">{project.nextMilestone.title}</span>
      </div>
    );
  }
}

// <PointsOfContact
//   groupId={id}
//   groupName={data.group.name}
//   pointsOfContact={data.group.pointsOfContact}
//   onAddContact={refetch}
// />

// <Projects groupId={id} />
// <Objectives groupId={id} />
