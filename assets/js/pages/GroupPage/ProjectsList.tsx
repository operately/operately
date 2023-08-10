import React from "react";

import { useNavigate } from "react-router-dom";

import * as Groups from "@/graphql/Groups";
import * as Projects from "@/graphql/Projects";
import * as ProjectIcons from "@/components/ProjectIcons";
import * as Icons from "@tabler/icons-react";

import Table from "@/components/Table";

export function Championed({ group }: { group: Groups.Group }) {
  const { data, loading, error } = Projects.useProjects({ groupId: group.id, groupMemberRoles: ["champion"] });

  if (error) throw error;

  return (
    <ProjectTable
      title="Championed Projects"
      subtitle="Members of this group are leading the effort on these projects."
      projects={data?.projects}
      loading={loading}
      columns={{ title: true, timeline: true, champion: true, status: true }}
      emptyState={
        <EmptyState
          title="No championed projects."
          subtitle="When members of this group are assigned as champions to projects, the projects will appear here."
        />
      }
    />
  );
}

export function Reviewed({ group }: { group: Groups.Group }) {
  const { data, loading, error } = Projects.useProjects({ groupId: group.id, groupMemberRoles: ["reviewer"] });

  if (error) throw error;

  return (
    <ProjectTable
      title="Reviewed Projects"
      subtitle="Members of this group are accountable for reviewing these projects."
      projects={data?.projects}
      loading={loading}
      columns={{ title: true, timeline: true, reviewer: true, status: true }}
      emptyState={
        <EmptyState
          title="No reviewed projects."
          subtitle="When members of this group are assigned as reviewers to projects, the projects will appear here."
        />
      }
    />
  );
}

interface ProjectTableProps {
  title: string;
  subtitle: string;
  projects: Projects.Project[];
  loading: boolean;
  emptyState: JSX.Element;
  columns: {
    title?: boolean;
    timeline?: boolean;
    champion?: boolean;
    reviewer?: boolean;
    status?: boolean;
  };
}

function ProjectTable({ title, subtitle, projects, loading, emptyState, columns }: ProjectTableProps) {
  const navigate = useNavigate();

  if (loading) return <></>;

  const style = {
    header: {
      className: "bg-dark-4",
    },
  };

  const headers = [
    { id: "title", label: "Title", size: "flex-1", visible: columns.title || false },
    { id: "timeline", label: "Timeline", size: "w-36", visible: columns.timeline || false },
    { id: "champion", label: "Champion", size: "w-24", visible: columns.champion || false },
    { id: "reviewer", label: "Reviewer", size: "w-24", visible: columns.reviewer || false },
    { id: "status", label: "Status", size: "w-10", visible: columns.status || false },
  ];

  const rows = projects.map((p) => {
    return {
      onClick: () => navigate(`/projects/${p.id}`),
      cells: {
        status: <Status project={p} />,
        title: p.name,
        timeline: <ProjectIcons.Timeline project={p} />,
        champion: <ProjectIcons.Champion person={p.champion} />,
        reviewer: <ProjectIcons.Reviewer person={p.reviewer} />,
      },
    };
  });

  return (
    <div className="border border-dark-6 rounded-lg" style={{ minHeight: "10rem" }}>
      <div className="px-6 py-4 bg-dark-4 border-b border-dark-6">
        <div className="font-bold">{title}</div>
        <div className="text-sm text-white-2">{subtitle}</div>
      </div>

      {projects.length === 0 ? emptyState : <Table headers={headers} rows={rows} style={style} />}
    </div>
  );
}

function Status({ project }: { project: Projects.Project }) {
  return (
    <div className="flex items-center gap-2">
      <ProjectIcons.IconForHealth health={project.health} />
      <ProjectIcons.IconForPhase phase={project.phase} />
    </div>
  );
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="px-6 py-8 text-white-1/80">
      <Icons.IconSeeding size={24} className="text-lime-400/70" /> <br />
      {title}
      <br />
      {subtitle}
    </div>
  );
}
