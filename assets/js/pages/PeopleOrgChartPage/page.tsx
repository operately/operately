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
    <div className="flex items-center justify-center gap-4">
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
    <div className="flex items-center justify-center gap-4 flex-wrap">
      {reports.map((node) => (
        <PersonCard key={node.person.id} node={node} chart={chart} />
      ))}
    </div>
  );
}

function Subtree({ node, chart }: { node: OrgChartNode; chart: OrgChart }) {
  const reports = chart.nodes.filter((n) => n.person.managerId === node.person.id);
  const sortedReports = [...reports].sort((a, b) => b.totalReports - a.totalReports);

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
          <div className="font-semibold leading-tight text-center text-sm">
            <Link to={path} underline={false}>
              {person.fullName}
            </Link>
          </div>
          <div className="font-medium text-sm text-content-dimmed text-center">{person.title}</div>
        </div>
      </div>

      <div className="flex items-center justify-center">
        <div
          className={classNames({
            "rounded-xl text-xs px-1.5 py-0.5 flex items-center gap-0.5 cursor-pointer": true,
            "bg-dark-3 text-white-1": chart.expanded.includes(person.id),
            "bg-stone-400 text-white-1": !chart.expanded.includes(person.id),
          })}
          onClick={() => chart.toggle(person.id)}
        >
          {node.totalReports}
          {chart.expanded.includes(person.id) ? <Icons.IconChevronUp size={14} /> : <Icons.IconChevronDown size={14} />}
        </div>
      </div>
    </div>
  );
}
