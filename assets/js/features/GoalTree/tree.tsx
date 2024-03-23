import { Goal } from "@/models/goals";
import { Project } from "@/models/projects";
import { Paths } from "@/routes/paths";

import * as Icons from "@tabler/icons-react";

export class Tree {
  private allGoals: Goal[];
  private roots: { [key: string]: GoalNode };

  static build(allGoals: Goal[]): Tree {
    return new Tree(allGoals);
  }

  constructor(allGoals: Goal[]) {
    this.allGoals = allGoals;
    this.roots = this.buildRoots();
  }

  getRoots(): Node[] {
    return Object.values(this.roots);
  }

  buildRoots(): { [key: string]: GoalNode } {
    const parentless = this.allGoals.filter((g) => !g.parentGoalId);

    const res = {};

    parentless.forEach((goal) => {
      res[goal.id] = this.buildTree(goal);
    });

    return res;
  }

  buildTree(goal: Goal, depth: number = 0): GoalNode {
    const children = this.allGoals.filter((g) => g.parentGoalId === goal.id);
    const childNodes = children.map((g) => this.buildTree(g, depth + 1));

    return new GoalNode(goal, childNodes, depth);
  }
}

export interface Node {
  id: string;
  type: "goal" | "project";
  name: string;
  linkTo: string;
  children: Node[];
  depth: number;
  hasChildren: boolean;

  childrenInfoLabel(): string | null;
}

export class GoalNode implements Node {
  public id: string;
  public type: "goal" = "goal";
  public goal: Goal;
  public name: string;
  public linkTo: string;
  public children: Node[];
  public subGoals: GoalNode[];
  public projects: ProjectNode[];
  public depth: number;
  public hasChildren: boolean;
  public totalNestedProjects: number;
  public totalNestedSubGoals: number;

  constructor(goal: Goal, subGoals: GoalNode[], depth: number = 0) {
    this.id = goal.id;
    this.type = "goal";
    this.name = goal.name;
    this.linkTo = Paths.goalPath(goal.id);
    this.goal = goal;
    this.depth = depth;

    this.subGoals = subGoals;
    this.projects = this.buildProjectNodes();

    this.children = [...this.subGoals, ...this.projects];
    this.hasChildren = this.subGoals.length > 0 || this.projects.length > 0;

    this.totalNestedProjects = this.projects.length + this.subGoals.reduce((acc, n) => acc + n.totalNestedProjects, 0);
    this.totalNestedSubGoals = this.subGoals.length + this.subGoals.reduce((acc, n) => acc + n.totalNestedSubGoals, 0);
  }

  childrenInfoLabel(): string {
    return [this.nestedGoalCount(), this.nestedProjectCount()].filter((x) => x).join(", ");
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

export class ProjectNode implements Node {
  public id: string;
  public type: "goal" | "project";
  public name: string;
  public linkTo: string;
  public project: Project;
  public children: Node[];
  public depth: number;
  public hasChildren: boolean;

  constructor(project: Project, depth: number = 0) {
    this.id = project.id;
    this.type = "project";
    this.name = project.name;
    this.linkTo = Paths.projectPath(project.id);
    this.project = project;
    this.depth = depth;
    this.children = [];
    this.hasChildren = false;
  }

  childrenInfoLabel(): string | null {
    return null;
  }
}
