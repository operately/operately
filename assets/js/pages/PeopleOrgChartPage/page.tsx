import * as React from "react";
import * as Pages from "@/components/Pages";

import { useLoadedData } from "./loader";
import Avatar from "@/components/Avatar";
import { Link } from "@/components/Link";

import { useOrgChart, OrgChart, OrgChartNode, ExpandNodeFn } from "./useOrgChart";

export function Page() {
  const { people } = useLoadedData();

  const chart = useOrgChart(people);

  return (
    <Pages.Page title={"PeoplePage"}>
      <div className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8 mt-16">
        <div className="flex items-center gap-4 justify-center mb-16">
          <Link to="/people">Employee List</Link>
          <div className="font-medium">Org Chart</div>
        </div>

        <Root chart={chart} />

        {chart.expanded.map((personId) => {
          const node = chart.nodes.find((n) => n.person.id === personId);
          if (!node) return null;

          return <Subtree key={personId} node={node} chart={chart} />;
        })}
      </div>
    </Pages.Page>
  );
}

function Root({ chart }: { chart: OrgChart }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {chart.root.map((node) => (
        <PersonCard key={node.person.id} node={node} chart={chart} />
      ))}
    </div>
  );
}

function Reports({ reports, chart }: { reports: OrgChartNode[]; chart: OrgChart }) {
  if (reports.length === 0) {
    return <div className="text-sm text-content-dimmed text-center">No reports</div>;
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
      {reports.map((node) => (
        <PersonCard key={node.person.id} node={node} chart={chart} />
      ))}
    </div>
  );
}

function Subtree({ node, chart }: { node: OrgChartNode; chart: OrgChart }) {
  const reports = chart.nodes.filter((n) => n.person.managerId === node.person.id);

  return (
    <div className="mt-8">
      <div className="flex items-center gap-1 text-xs justify-center">
        <Avatar person={node.person} size={20} />
        {node.person.fullName}
      </div>

      <div className="border-t border-surface-outline mt-4 mb-4" />

      <div
        className="text-sm text-content-dimmed text-right cursor-pointer"
        onClick={() => chart.collapse(node.person.id)}
      >
        Collapse
      </div>

      <Reports reports={reports} chart={chart} />
    </div>
  );
}

function PersonCard({ node, chart }: { node: OrgChartNode; chart: OrgChart }) {
  const person = node.person;
  const path = `/people/${person.id}`;

  return (
    <div className="bg-surface rounded shadow p-4 border border-stroke-base">
      <div className="flex items-start gap-4">
        <Avatar person={person} size={40} />

        <div className="flex flex-col">
          <div className="font-bold leading-tight">
            <Link to={path} underline={false}>
              {person.fullName}
            </Link>
          </div>
          <div className="font-medium text-sm text-content-dimmed">{person.title}</div>

          <div className="mt-2" onClick={() => chart.expand(person.id)}>
            {node.totalReports}
          </div>
        </div>
      </div>
    </div>
  );
}
