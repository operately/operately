import * as React from "react";
import { Person } from "@/models/people";

export type ExpandNodeFn = (personId: string) => void;
export type CollapseNodeFn = (personId: string) => void;

export interface OrgChartNode {
  person: Person;
  totalReports: number;
}

export interface OrgChart {
  root: OrgChartNode[];
  nodes: OrgChartNode[];

  expanded: string[];
  expand: ExpandNodeFn;
  collapse: CollapseNodeFn;
}

export function useOrgChart(people: Person[]): OrgChart {
  const nodes = people.map((person) => ({ person, totalReports: 0 }));
  const root = nodes.filter((node) => !node.person.managerId);

  nodes.forEach((node) => {
    const reports = nodes.filter((n) => n.person.managerId === node.person.id);

    node.totalReports = reports.length;
  });

  const [expanded, setExpanded] = React.useState<string[]>([]);

  const expand = (personId: string) => {
    setExpanded((ids) => [...ids, personId]);
  };

  const collapse = (personId: string) => {
    setExpanded((ids) => ids.filter((id) => id !== personId));
  };

  return { root, nodes, expanded, expand, collapse };
}
