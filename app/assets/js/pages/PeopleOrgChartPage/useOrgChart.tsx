import * as React from "react";
import { Person } from "@/models/people";
import { compareIds } from "@/routes/paths";

type ExpandNodeFn = (personId: string) => void;
type CollapseNodeFn = (personId: string) => void;
type ToggleNodeFn = (personId: string) => void;

export interface OrgChartNode {
  person: Person;
  directReports: number;
  totalReports: number;
}

export interface OrgChart {
  root: OrgChartNode[];
  nodes: OrgChartNode[];

  expanded: string[];
  expand: ExpandNodeFn;
  collapse: CollapseNodeFn;
  toggle: ToggleNodeFn;
}

export function useOrgChart(people: Person[]): OrgChart {
  const nodes = React.useMemo(() => peopleToNodes(people), [people]);
  const root = nodes.filter((node) => !node.person.manager?.id);

  const [expanded, setExpanded] = React.useState<string[]>([]);

  const expand = (personId: string) => {
    const managerId = nodes.find((n) => compareIds(n.person.id, personId))?.person.manager?.id;
    const indexOfManager = expanded.indexOf(managerId!);

    setExpanded((ids) => [...ids.slice(0, indexOfManager + 1), personId]);
  };

  const collapse = (personId: string) => {
    const index = expanded.indexOf(personId);

    setExpanded((ids) => [...ids.slice(0, index)]);
  };

  const toggle = (personId: string) => {
    if (expanded.includes(personId)) {
      collapse(personId);
    } else {
      expand(personId);
    }
  };

  return { root, nodes, expanded, expand, collapse, toggle };
}

function peopleToNodes(people: Person[]): OrgChartNode[] {
  const nodes = people.map((person) => ({ person, directReports: 0, totalReports: 0 }));

  nodes.forEach((node) => {
    const reports = nodes.filter((n) => compareIds(n.person.manager?.id, node.person.id));
    node.directReports = reports.length;
  });

  nodes.forEach((node) => {
    node.totalReports = calcTotalReports(node, nodes);
  });

  return nodes;
}

function calcTotalReports(node: OrgChartNode, nodes: OrgChartNode[]): number {
  const reports = nodes.filter((n) => compareIds(n.person.manager?.id, node.person.id));

  let res = 0;

  reports.forEach((report) => {
    res += calcTotalReports(report, nodes);
  });

  return res + reports.length;
}
