import * as React from "react";
import * as Pages from "@/components/Pages";

import { useLoadedData } from "./loader";
import Avatar from "@/components/Avatar";
import { Link } from "@/components/Link";
import * as Icons from "@tabler/icons-react";

import { useOrgChart, OrgChart, OrgChartNode } from "./useOrgChart";
import classNames from "classnames";

export function Page() {
  const { people } = useLoadedData();

  const chart = useOrgChart(people);

  return (
    <Pages.Page title={"Org Chart"}>
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
  const sortedReports = sortNodes(chart.root);

  return <Reports reports={sortedReports} chart={chart} />;
}

function Reports({ reports, chart }: { reports: OrgChartNode[]; chart: OrgChart }) {
  return (
    <div className="flex items-center justify-center gap-4 flex-wrap">
      {reports.map((node) => (
        <PersonCard key={node.person.id} node={node} chart={chart} />
      ))}
    </div>
  );
}

function Subtree({ node, chart }: { node: OrgChartNode; chart: OrgChart }) {
  const reports = chart.nodes.filter((n) => n.person.managerId === node.person.id);
  const sortedReports = sortNodes(reports);

  return (
    <div className="mt-12">
      <div className="flex items-center gap-1 text-xs justify-center">
        <Avatar person={node.person} size={20} />
        {node.person.fullName}
      </div>

      <div className="h-3 border-l w-0.5 bg-dark-8 mx-auto mt-2" />
      <div className="border-t border-x border-dark-8 mb-4 h-3 rounded-t-lg" />

      <div
        className="text-xs text-content-dimmed text-right cursor-pointer flex items-center gap-1 justify-end -mt-5 px-2"
        onClick={() => chart.collapse(node.person.id)}
      >
        Collapse <Icons.IconChevronUp size={14} />
      </div>

      <div className="px-8 mt-4 mb-4">
        <Reports reports={sortedReports} chart={chart} />
      </div>
    </div>
  );
}

function PersonCard({ node, chart }: { node: OrgChartNode; chart: OrgChart }) {
  const person = node.person;
  const path = `/people/${person.id}`;

  return (
    <div className="">
      <div className="flex justify-center">
        <Avatar person={person} size={50} />
      </div>

      <div className="bg-surface border border-stroke-base rounded-2xl w-52 -mt-[25px] pt-[25px] -mb-3 pb-3">
        <div className="my-3">
          <div className="font-semibold leading-tight text-center text-sm px-4 mb-1">
            <Link to={path} underline={false}>
              {person.fullName}
            </Link>
          </div>
          <div className="font-medium text-sm text-content-dimmed text-center px-4">{person.title}</div>
        </div>
      </div>

      <div className="flex items-center justify-center">
        <div
          className={classNames({
            "rounded-xl text-xs px-1.5 py-0.5 flex items-center gap-0.5 ": true,
            "bg-dark-3 text-white-1": chart.expanded.includes(person.id),
            "bg-stone-400 text-white-1": !chart.expanded.includes(person.id),
            "opacity-0": node.totalReports === 0,
            "cursor-pointer": node.totalReports > 0,
          })}
          onClick={() => {
            if (node.totalReports > 0) {
              chart.toggle(person.id);
            }
          }}
        >
          {node.totalReports}
          {chart.expanded.includes(person.id) ? <Icons.IconChevronUp size={14} /> : <Icons.IconChevronDown size={14} />}
        </div>
      </div>
    </div>
  );
}

function sortNodes(nodes: OrgChartNode[]) {
  return [...nodes].sort((a, b) => {
    if (a.totalReports > b.totalReports) return -1;
    if (a.totalReports < b.totalReports) return 1;

    return a.person.fullName.localeCompare(b.person.fullName);
  });
}
