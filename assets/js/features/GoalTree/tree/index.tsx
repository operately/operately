import { Goal } from "@/models/goals";
import { Node } from "./node";
import { GoalNode } from "./goalNode";

export type SortColumn = "name" | "space" | "timeframe" | "progress" | "lastCheckIn" | "champion";
export type SortDirection = "asc" | "desc";

export { Node } from "./node";
export { GoalNode } from "./goalNode";
export { ProjectNode } from "./projectNode";

export interface TreeFilters {
  spaceId: string | null;
}

export class Tree {
  private allGoals: Goal[];
  private roots: GoalNode[];
  private sortColumn: SortColumn;
  private sortDirection: SortDirection;
  private filters: TreeFilters;

  static build(allGoals: Goal[], sortColumn: SortColumn, sortDirection: SortDirection, filters: TreeFilters): Tree {
    return new Tree(allGoals, sortColumn, sortDirection, filters);
  }

  constructor(allGoals: Goal[], sortColumn: SortColumn, sortDirection: SortDirection, filters: TreeFilters) {
    this.filters = filters;
    this.allGoals = allGoals;
    this.sortColumn = sortColumn;
    this.sortDirection = sortDirection;
    this.roots = this.buildRoots();
  }

  getRoots(): Node[] {
    return this.roots;
  }

  buildRoots(): GoalNode[] {
    const goals = this.filters.spaceId
      ? this.allSpaceGoalsWithoutParentInSpace(this.filters.spaceId)
      : this.allGoalsWithoutParent();

    return goals.map((g) => this.buildTree(g)).sort((a, b) => a.compare(b, this.sortColumn, this.sortDirection));
  }

  buildTree(goal: Goal, depth: number = 0): GoalNode {
    const children = this.allGoals.filter((g) => g.parentGoalId === goal.id);
    const childNodes = children.map((g) => this.buildTree(g, depth + 1));

    return new GoalNode(goal, childNodes, depth, this.sortColumn, this.sortDirection);
  }

  getAllNodes(): Node[] {
    return this.roots.flatMap((root) => root.getAllNodes());
  }

  private allGoalsWithoutParent(): Goal[] {
    return this.allGoals.filter((g) => !g.parentGoalId);
  }

  private allSpaceGoalsWithoutParentInSpace(spaceId: string): Goal[] {
    const goalsNotInSpace = this.allGoals.filter((g) => g.space.id !== spaceId);
    const goalsInSpace = this.allGoals.filter((g) => g.space.id === spaceId);

    return goalsInSpace.filter((g) => goalsNotInSpace.some((goal) => goal.id === g.parentGoalId));
  }
}
