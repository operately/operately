import React from "react";
import { useTranslation } from "react-i18next";
import type { Person } from "../ApiTypes";
import { Avatar } from "../Avatar";
import { Link } from "../Link";
import { UnstyledButton } from "../Button/UnstalyedButton";
import { IconChevronUp, IconChevronDown } from "../icons";
import { tn } from "../i18n";
import classNames from "../utils/classnames";

export namespace PeopleOrgChartPage {
  export interface Node {
    person: Person;
    directReports: number;
    totalReports: number;
  }

  export interface Chart {
    root: Node[];
    nodes: Node[];
    expanded: string[];
    collapse: (id: string) => void;
    toggle: (id: string) => void;
  }

  export interface Props {
    chart: Chart;
    profileHref: (id: string) => string;
    idsMatch: (a: string | null | undefined, b: string | null | undefined) => boolean;
  }
}

export function PeopleOrgChartPage(props: PeopleOrgChartPage.Props) {
  const { t } = useTranslation();
  const { chart } = props;

  return (
    <div className="max-w-5xl mx-auto sm:px-6 lg:px-8 mt-20">
      <h1 className="text-3xl font-bold text-center mt-2 mb-16">{t("Org Chart")}</h1>
      <Root {...props} />

      {chart.expanded.map((personId) => {
        const node = chart.nodes.find((n) => n.person.id === personId);
        if (!node) return null;

        return <Subtree key={personId} node={node} {...props} />;
      })}
    </div>
  );
}

function Root(props: PeopleOrgChartPage.Props) {
  const { chart } = props;
  const sortedReports = sortNodes(chart.root);

  return <Reports reports={sortedReports} {...props} />;
}

function Reports({ reports, ...props }: { reports: PeopleOrgChartPage.Node[] } & PeopleOrgChartPage.Props) {
  return (
    <div className="flex items-center justify-center gap-4 flex-wrap">
      {reports.map((node) => (
        <PersonCard key={node.person.id} node={node} {...props} />
      ))}
    </div>
  );
}

function Subtree({ node, ...props }: { node: PeopleOrgChartPage.Node } & PeopleOrgChartPage.Props) {
  const { t } = useTranslation();
  const { chart, idsMatch } = props;
  const reports = chart.nodes.filter((n) => idsMatch(n.person.manager?.id, node.person.id));
  const sortedReports = sortNodes(reports);

  return (
    <div className="mt-12">
      <div className="flex items-center gap-1 text-xs justify-center">
        <Avatar person={node.person} size={20} />
        {node.person.fullName}
      </div>

      <div className="h-3 border-l w-0.5 bg-dark-8 mx-auto mt-2" />
      <div className="border-t border-x border-dark-8 mb-4 h-3 rounded-t-lg" />

      <UnstyledButton
        className="text-xs text-content-dimmed text-right cursor-pointer flex items-center gap-1 justify-end -mt-5 px-2 ml-auto"
        ariaLabel={t("Collapse reports for {{name}}", { name: node.person.fullName })}
        onClick={() => chart.collapse(node.person.id)}
      >
        {t("Collapse")} <IconChevronUp size={14} />
      </UnstyledButton>

      <div className="px-8 mt-4 mb-4">
        <Reports reports={sortedReports} {...props} />
      </div>
    </div>
  );
}

function PersonCard({ node, chart, profileHref }: { node: PeopleOrgChartPage.Node } & PeopleOrgChartPage.Props) {
  const { t } = useTranslation();
  const person = node.person;
  const path = profileHref(person.id);
  const expanded = chart.expanded.includes(person.id);

  return (
    <div className="">
      <div className="flex justify-center">
        <Avatar person={person} size={50} />
      </div>

      <div className="bg-surface-base border border-stroke-base rounded-2xl w-52 -mt-[25px] pt-[25px] -mb-3 pb-3">
        <div className="my-3">
          <div className="font-semibold leading-tight text-center text-sm px-4 mb-1">
            <Link to={path} underline="never">
              {person.fullName}
            </Link>
          </div>
          <div className="font-medium text-sm text-content-dimmed text-center px-4">{person.title}</div>
        </div>
      </div>

      <div className="flex items-center justify-center">
        <UnstyledButton
          disabled={node.totalReports === 0}
          ariaLabel={
            expanded
              ? t("Collapse reports for {{name}}", { name: person.fullName })
              : tn("Expand 1 report for {{name}}", "Expand {{count}} reports for {{name}}", node.totalReports, {
                  name: person.fullName,
                })
          }
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
          {chart.expanded.includes(person.id) ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
        </UnstyledButton>
      </div>
    </div>
  );
}

function sortNodes(nodes: PeopleOrgChartPage.Node[]) {
  return [...nodes].sort((a, b) => {
    if (a.totalReports > b.totalReports) return -1;
    if (a.totalReports < b.totalReports) return 1;

    return a.person.fullName.localeCompare(b.person.fullName);
  });
}
