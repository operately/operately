import { Goal } from "@/models/goals";
import { Paths } from "@/routes/paths";
import { ProjectNode } from "./projectNode";
import { Node } from "./node";
import { SortColumn, SortDirection } from "./";

import * as Time from "@/utils/time";

export class GoalNode extends Node {
  public goal: Goal;
  public subGoals: GoalNode[];
  public projects: ProjectNode[];
  public totalNestedProjects: number;
  public totalNestedSubGoals: number;

  constructor(
    goal: Goal,
    subGoals: GoalNode[],
    depth: number = 0,
    sortColumn: SortColumn,
    sortDirection: SortDirection,
    showCompleted: boolean,
  ) {
    super();

    this.id = goal.id;
    this.type = "goal";
    this.depth = depth;
    this.name = goal.name;
    this.sortColumn = sortColumn;
    this.sortDirection = sortDirection;
    this.showCompleted = showCompleted;

    this.linkTo = Paths.goalPath(goal.id);
    this.champion = goal.champion!;

    this.subGoals = subGoals;
    this.goal = goal;

    this.subGoals = this.subGoals.sort((a, b) => a.compare(b, this.sortColumn, this.sortDirection));

    this.projects = this.buildProjectNodes()
      .filter((p) => (this.showCompleted ? true : !p.project.closedAt))
      .sort((a, b) => a.compare(b, this.sortColumn, this.sortDirection));

    this.children = [...this.subGoals, ...this.projects];

    this.hasChildren = this.children.length > 0;
    this.space = goal.space;
    this.isClosed = goal.isClosed;
    this.progress = this.goal.progressPercentage;
    this.lastCheckInDate = Time.parseDate(goal.lastCheckIn?.insertedAt);
    this.spaceId = goal.space.id;

    this.totalNestedProjects = this.projects.length + this.subGoals.reduce((acc, n) => acc + n.totalNestedProjects, 0);
    this.totalNestedSubGoals = this.subGoals.length + this.subGoals.reduce((acc, n) => acc + n.totalNestedSubGoals, 0);
  }

  childrenInfoLabel(): string {
    return [this.nestedGoalCount(), this.nestedProjectCount()].filter((x) => x).join(", ");
  }

  compareTimeframe(b: GoalNode): number {
    return Time.compareQuarters(this.goal.timeframe, b.goal.timeframe);
  }

  getAllNodes(): Node[] {
    return [this, ...this.subGoals.flatMap((g) => g.getAllNodes()), ...this.projects];
  }

  private buildProjectNodes(): ProjectNode[] {
    if (!this.goal.projects) return [];

    return this.goal.projects!.map((p) => p!).map((p) => new ProjectNode(p, this.depth + 1));
  }

  private nestedGoalCount() {
    if (this.totalNestedSubGoals === 0) return null;

    if (this.totalNestedSubGoals === 1) {
      return "1 subgoal";
    } else {
      return `${this.totalNestedSubGoals} subgoals`;
    }
  }

  private nestedProjectCount() {
    if (this.totalNestedProjects === 0) return null;

    if (this.totalNestedProjects === 1) {
      return "1 project";
    } else {
      return `${this.totalNestedProjects} projects`;
    }
  }
}
