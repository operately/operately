import { Goal } from "@/models/goals";
import { Project } from "@/models/projects";

export class Tree {
  private allGoals: Goal[];
  private roots: { [key: string]: Node };

  static build(allGoals: any) {
    return new Tree(allGoals);
  }

  constructor(allGoals: any) {
    this.allGoals = allGoals;
    this.roots = this.buildRoots();
  }

  getRoots(): Node[] {
    return Object.values(this.roots);
  }

  buildRoots(): { [key: string]: Node } {
    const parentless = this.allGoals.filter((g) => !g.parentGoalId);

    const res = {};

    parentless.forEach((goal) => {
      res[goal.id] = this.buildTree(goal);
    });

    return res;
  }

  buildTree(goal: Goal, depth: number = 0): Node {
    const children = this.allGoals.filter((g) => g.parentGoalId === goal.id);
    const childNodes = children.map((g) => this.buildTree(g, depth + 1));

    return new Node(goal, childNodes, depth);
  }
}

export class Node {
  public goal: Goal;
  public subGoals: Node[];
  public projects: Project[];
  public depth: number;
  public hasChildren: boolean;
  public totalNestedProjects: number;
  public totalNestedSubGoals: number;

  constructor(goal: Goal, children: Node[], depth: number = 0) {
    this.goal = goal;
    this.depth = depth;

    this.subGoals = children;
    this.projects = goal.projects!.filter((p) => p!.status !== "closed").map((p) => p!);
    this.hasChildren = this.subGoals.length > 0 || this.projects.length > 0;

    this.totalNestedProjects = this.projects.length + this.subGoals.reduce((acc, n) => acc + n.totalNestedProjects, 0);
    this.totalNestedSubGoals = this.subGoals.length + this.subGoals.reduce((acc, n) => acc + n.totalNestedSubGoals, 0);
  }

  childrenInfoLabel(): string {
    return [this.nestedGoalCount(), this.nestedProjectCount()].filter((x) => x).join(", ");
  }

  nestedGoalCount() {
    if (this.totalNestedSubGoals === 0) return null;

    if (this.totalNestedSubGoals === 1) {
      return "1 subgoal";
    } else {
      return `${this.totalNestedSubGoals} subgoals`;
    }
  }

  nestedProjectCount() {
    if (this.totalNestedProjects === 0) return null;

    if (this.totalNestedProjects === 1) {
      return "1 project";
    } else {
      return `${this.totalNestedProjects} projects`;
    }
  }
}
