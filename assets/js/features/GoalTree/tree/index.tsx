import { Goal } from "@/models/goals";
import { Node } from "./node";
import { GoalNode } from "./goalNode";

export type SortColumn = "name" | "progress" | "lastCheckIn" | "champion";
export type SortDirection = "asc" | "desc";

export { Node } from "./node";
export { GoalNode } from "./goalNode";
export { ProjectNode } from "./projectNode";

export class Tree {
  private allGoals: Goal[];
  private roots: GoalNode[];
  private sortColumn: SortColumn;
  private sortDirection: SortDirection;

  static build(allGoals: Goal[], sortColumn: SortColumn, sortDirection: SortDirection): Tree {
    return new Tree(allGoals, sortColumn, sortDirection);
  }

  constructor(allGoals: Goal[], sortColumn: SortColumn, sortDirection: SortDirection) {
    this.allGoals = allGoals;
    this.sortColumn = sortColumn;
    this.sortDirection = sortDirection;
    this.roots = this.buildRoots();
  }

  getRoots(): Node[] {
    return this.roots;
  }

  buildRoots(): GoalNode[] {
    return this.allGoals
      .filter((g) => !g.parentGoalId)
      .map((g) => this.buildTree(g))
      .sort((a, b) => a.compare(b, this.sortColumn, this.sortDirection));
  }

  buildTree(goal: Goal, depth: number = 0): GoalNode {
    const children = this.allGoals.filter((g) => g.parentGoalId === goal.id);
    const childNodes = children.map((g) => this.buildTree(g, depth + 1));

    return new GoalNode(goal, childNodes, depth, this.sortColumn, this.sortDirection);
  }
}
