import { Goal } from "@/models/goals";
import { Project } from "@/models/projects";

import { Node } from "./node";
import { GoalNode } from "./goalNode";
import { ProjectNode } from "./projectNode";

export { Node } from "./node";
export { ProjectNode } from "./projectNode";
export { GoalNode } from "./goalNode";

export type SortColumn = "name" | "space" | "timeframe" | "progress" | "lastCheckIn" | "champion";
export type SortDirection = "asc" | "desc";

export interface TreeOptions {
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  showCompleted: boolean;

  spaceId?: string;
  personId?: string;
  goalId?: string;
}

export function buildTree(allGoals: Goal[], allProjects: Project[], options: TreeOptions): Node[] {
  const goalNodes = allGoals.map((g) => new GoalNode(g));
  const projectNodes = allProjects.map((p) => new ProjectNode(p));

  let nodes = [...goalNodes, ...projectNodes];

  if (!options.showCompleted) {
    nodes = nodes.filter((n) => !n.isClosed);
  }

  connectNodes(nodes);

  let roots = findRoots(nodes, options);

  setDepth(roots, 0);

  return roots;
}

function findRoots(nodes: Node[], options: TreeOptions): Node[] {
  if (options.spaceId) {
    return rootNodesForSpace(nodes, options.spaceId);
  } else if (options.personId) {
    return rootNodesForPerson(nodes, options.personId);
  } else if (options.goalId) {
    return rootNodesForGoal(nodes, options.goalId);
  } else {
    return rootNodesInTheCompany(nodes);
  }
}

function rootNodesForSpace(nodes: Node[], spaceId: string): Node[] {
  return nodes.filter((n) => n.space.id === spaceId && n.hasNoParentWith((node) => node.space.id === spaceId));
}

function rootNodesForPerson(nodes: Node[], personId: string): Node[] {
  return nodes.filter((n) => n.champion.id === personId && n.hasNoParentWith((node) => node.champion.id === personId));
}

function rootNodesInTheCompany(nodes: Node[]): Node[] {
  return nodes.filter((n) => !n.parentId);
}

function rootNodesForGoal(nodes: Node[], goalId: string): Node[] {
  return nodes.filter((n) => n.parentId === goalId && n.hasNoParentWith((node) => node.id === goalId));
}

function setDepth(nodes: Node[], depth: number = 0): void {
  nodes.forEach((n) => {
    n.depth = depth;
    setDepth(n.children, depth + 1);
  });
}

function connectNodes(nodes: Node[]): void {
  nodes.forEach((n) => {
    const children = nodes.filter((c) => c.parentId === n.id);
    const parent = nodes.find((c) => c.id === n.parentId);

    n.addChildren(children);
    n.setParent(parent);
  });
}
