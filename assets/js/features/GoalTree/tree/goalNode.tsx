import { match } from "ts-pattern";
import { Goal } from "@/models/goals";
import { Paths } from "@/routes/paths";
import { ProjectNode } from "./projectNode";
import { Node, NodeTypes } from "./node";
import { SortColumn, SortDirection } from "./";

import * as People from "@/models/people";
import * as Time from "@/utils/time";

export class GoalNode implements Node {
  public id: string;
  public type: NodeTypes;
  public goal: Goal;
  public champion: People.Person;
  public name: string;
  public linkTo: string;
  public children: Node[];
  public subGoals: GoalNode[];
  public projects: ProjectNode[];
  public depth: number;
  public hasChildren: boolean;
  public totalNestedProjects: number;
  public totalNestedSubGoals: number;
  public progress: number;
  public lastCheckInDate: Date | null;

  constructor(
    goal: Goal,
    subGoals: GoalNode[],
    depth: number = 0,
    sortColumn: SortColumn,
    sortDirection: SortDirection,
  ) {
    this.id = goal.id;
    this.type = "goal";
    this.name = goal.name;
    this.linkTo = Paths.goalPath(goal.id);
    this.goal = goal;
    this.depth = depth;
    this.champion = goal.champion!;

    this.subGoals = subGoals.sort((a, b) => a.compare(b, sortColumn, sortDirection));
    this.projects = this.buildProjectNodes().sort((a, b) => a.compare(b, sortColumn, sortDirection));

    this.children = [...this.subGoals, ...this.projects];
    this.hasChildren = this.subGoals.length > 0 || this.projects.length > 0;

    this.totalNestedProjects = this.projects.length + this.subGoals.reduce((acc, n) => acc + n.totalNestedProjects, 0);
    this.totalNestedSubGoals = this.subGoals.length + this.subGoals.reduce((acc, n) => acc + n.totalNestedSubGoals, 0);

    this.progress = goal.progressPercentage;
    this.lastCheckInDate = Time.parse(goal.lastCheckIn?.insertedAt);
  }

  childrenInfoLabel(): string {
    return [this.nestedGoalCount(), this.nestedProjectCount()].filter((x) => x).join(", ");
  }

  compare(b: GoalNode, sortColumn: SortColumn, sortDirection: SortDirection): number {
    const result = match(sortColumn)
      .with("name", () => this.name.localeCompare(b.name))
      .with("progress", () => this.progress - b.progress)
      .with("lastCheckIn", () => Time.compareAsc(this.lastCheckInDate!, b.lastCheckInDate!))
      .with("champion", () => this.champion?.fullName.localeCompare(b.champion?.fullName!)!)
      .exhaustive();

    const directionFactor = sortDirection === "asc" ? 1 : -1;
    return result * directionFactor;
  }

  getAllNodes(): Node[] {
    return [this, ...this.subGoals.flatMap((g) => g.getAllNodes()), ...this.projects];
  }

  private buildProjectNodes(): ProjectNode[] {
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
