import React from "react";

import * as Groups from "@/graphql/Groups";
import * as Projects from "@/graphql/Projects";

export default function OwnedProjects({ group }: { group: Groups.Group }) {
  const { data, loading, error } = Projects.useProjects({
    groupId: group.id,
    groupMemberRoles: ["champion"],
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return <ProjectTable projects={data.projects} />;
}

function ProjectTable({ projects }: { projects: Projects.Project[] }) {
  return (
    <>
      {projects.map((p) => (
        <ProjectRow key={p.id} project={p} />
      ))}
    </>
  );
}

function ProjectRow({ project }: { project: Projects.Project }) {
  return (
    <div className="flex items-center gap-4 mb-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300" />
      <div className="flex-grow">
        <div className="font-bold">{project.name}</div>
        <div className="text-sm text-gray-500">{project.description}</div>
        <div className="text-sm text-gray-500">{project.champion?.fullName}</div>
      </div>
    </div>
  );
}
