import React from "react";

import { useNavigate } from "react-router-dom";

import * as Groups from "@/graphql/Groups";
import * as Projects from "@/graphql/Projects";
import * as ProjectIcons from "@/components/ProjectIcons";
import * as Icons from "@tabler/icons-react";

import Table from "@/components/Table";

export default function OwnedProjects({ group }: { group: Groups.Group }) {
  const { data, loading, error } = Projects.useProjects({ groupId: group.id, groupMemberRoles: ["champion"] });

  if (error) throw error;

  return (
    <>
      <div className="border border-dark-6 rounded-lg" style={{ minHeight: "10rem" }}>
        <div className="px-6 py-4 bg-dark-4 border-b border-dark-6">
          <div className="font-bold">Championed Projects</div>
          <div className="text-sm text-white-2">Members of this group are leading the effort on these projects.</div>
        </div>

        <Body projects={data?.projects} loading={loading} />
      </div>
    </>
  );
}

function Body({ projects, loading }: { projects: Projects.Project[]; loading: boolean }) {
  if (loading) return <></>;
  if (projects.length === 0) return <EmptyState />;

  return <ProjectTable projects={projects} />;
}

function EmptyState() {
  return (
    <div className="px-6 py-8 text-white-1/80">
      <Icons.IconSeeding size={24} className="text-lime-400/70" /> <br />
      No championed projects. <br />
      When members of this group are assigned as champions to projects, the projects will appear here.
    </div>
  );
}

function ProjectTable({ projects }: { projects: Projects.Project[] }) {
  const navigate = useNavigate();

  const style = {
    header: {
      className: "bg-dark-4",
    },
  };

  const headers = [
    { id: "title", label: "Title", size: "flex-1" },
    { id: "timeline", label: "Timeline", size: "w-40" },
    { id: "champion", label: "Champion", size: "w-20" },
    { id: "status", label: "Status", size: "w-10" },
  ];

  const rows = projects.map((p) => {
    return {
      onClick: () => navigate(`/projects/${p.id}`),
      cells: {
        status: <Status project={p} />,
        title: p.name,
        timeline: <ProjectIcons.Timeline project={p} />,
        champion: <ProjectIcons.Champion person={p.champion} />,
      },
    };
  });

  return <Table headers={headers} rows={rows} style={style} />;
}

function Status({ project }: { project: Projects.Project }) {
  return (
    <div className="flex items-center gap-2">
      <ProjectIcons.IconForHealth health={project.health} />
      <ProjectIcons.IconForPhase phase={project.phase} />
    </div>
  );
}
