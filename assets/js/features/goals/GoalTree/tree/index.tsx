import { Goal } from "@/models/goals";
import { Node } from "./node";
import { GoalNode } from "./goalNode";

export type SortColumn = "name" | "space" | "timeframe" | "progress" | "lastCheckIn" | "champion";
export type SortDirection = "asc" | "desc";

export { Node } from "./node";
export { GoalNode } from "./goalNode";
export { ProjectNode } from "./projectNode";

export interface TreeFilters {
  spaceId?: string | null;
  personId?: string | null;
}

export class Tree {
  private roots: GoalNode[];

  constructor(
    private allGoals: Goal[],
    private allProjects: Goal[],
    private sortColumn: SortColumn,
    private sortDirection: SortDirection,
    private filters: TreeFilters,
    private showCompleted: boolean,
  ) {
    this.roots = this.buildRoots();
  }

  getRoots(): GoalNode[] {
    return this.roots;
  }

  buildRoots(): GoalNode[] {
    return this.filterGoals()
      .map((g) => this.buildTree(g))
      .filter((g) => this.showCompleted || !g.isClosed)
      .sort((a, b) => a.compare(b, this.sortColumn, this.sortDirection));
  }

  buildTree(goal: Goal, depth: number = 0): GoalNode {
    const children = this.allGoals
      .filter((g) => g.parentGoalId === goal.id)
      .filter((g) => this.showCompleted || !g.isClosed);

    const childNodes = children.map((g) => this.buildTree(g, depth + 1));

    return new GoalNode(goal, childNodes, depth, this.sortColumn, this.sortDirection, this.showCompleted);
  }

  getAllNodes(): Node[] {
    return this.roots.flatMap((root) => root.getAllNodes());
  }

  private filterGoals(): Goal[] {
    if (this.filters.spaceId) {
      return this.allSpaceGoalsWithoutParentInSpace(this.filters.spaceId);
    }

    if (this.filters.personId) {
      return this.allTopLevelGoalsForPerson(this.filters.personId);
    }

    return this.allGoalsWithoutParent();
  }

  private allGoalsWithoutParent(): Goal[] {
    return this.allGoals.filter((g) => !g.parentGoalId);
  }

  private allSpaceGoalsWithoutParentInSpace(spaceId: string): Goal[] {
    return this.allGoals
      .filter((g) => g.space.id === spaceId)
      .filter((g) => !this.hasAnyParentWith(g, (goal) => goal.space.id === spaceId));
  }

  private allTopLevelGoalsForPerson(personId: string): Goal[] {
    return this.allGoals
      .filter((g) => g.champion?.id === personId)
      .filter((g) => !this.hasAnyParentWith(g, (goal) => goal.champion?.id === personId));
  }

  private hasAnyParentWith(goal: Goal, predicate: (goal: Goal) => boolean): boolean {
    let currentGoal = this.findParent(goal);

    while (currentGoal) {
      if (predicate(currentGoal)) return true;
      currentGoal = this.findParent(currentGoal!);
    }

    return false;
  }

  private findParent(goal: Goal): Goal | undefined {
    return this.allGoals.find((g) => g.id === goal.parentGoalId);
  }
}
