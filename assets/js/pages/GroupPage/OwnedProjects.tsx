import React from "react";

import * as Groups from "@/graphql/Groups";
import * as Projects from "@/graphql/Projects";
import * as ProjectIcons from "@/components/ProjectIcons";

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
  const headers = [
    { id: "health", label: "" },
    { id: "phase", label: "" },
    { id: "title", label: "Title" },
    { id: "champion", label: "Champion" },
    { id: "timeline", label: "Timeline" },
  ];

  const rows = projects.map((p) => {
    return [
      { id: "health", value: <ProjectIcons.IconForHealth health={p.health} /> },
      { id: "phase", value: <ProjectIcons.IconForPhase phase={p.phase} /> },
      { id: "title", value: p.name },
      { id: "champion", value: <ProjectIcons.Champion person={p.champion} /> },
      { id: "timeline", value: p.startedAt + " - " + p.deadline },
    ];
  });

  return <Table headers={headers} rows={rows} />;
}

function Table({ headers, rows }: { headers: any[]; rows: any[] }) {
  return (
    <table className="w-full">
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h.id} className="text-left">
              {h.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id}>
            {r.map((c) => (
              <td key={c.id}>{c.value}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
