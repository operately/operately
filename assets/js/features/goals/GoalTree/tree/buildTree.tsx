import * as Timeframes from "@/utils/timeframes";

import { Person } from "@/models/people";
import { Goal } from "@/models/goals";
import { Project } from "@/models/projects";

import { Node } from "./node";
import { GoalNode } from "./goalNode";
import { ProjectNode } from "./projectNode";
import { compareIds } from "@/routes/paths";

export type SortColumn = "name" | "space" | "timeframe" | "progress" | "lastCheckIn" | "champion";
export type SortDirection = "asc" | "desc";

export interface TreeOptions {
  sortColumn: SortColumn;
  sortDirection: SortDirection;

  showActive: boolean;
  showPaused: boolean;
  showCompleted: boolean;

  showGoals: boolean;
  showProjects: boolean;

  ownedBy: "anyone" | "me";
  reviewedBy: "anyone" | "me";

  spaceId?: string;
  personId?: string;

  goalId?: string;
  timeframe?: Timeframes.Timeframe;
}

export type Tree = Node[];

export function buildTree(me: Person, allGoals: Goal[], allProjects: Project[], options: TreeOptions): Node[] {
  return new TreeBuilder(me, allGoals, allProjects, options).build();
}

export function getAllIds(nodes: Node[]): string[] {
  return nodes.reduce((acc, n) => {
    return [...acc, n.id, ...getAllIds(n.children)];
  }, []);
}

class TreeBuilder {
  constructor(
    private me: Person,
    private allGoals: Goal[],
    private allProjects: Project[],
    private options: TreeOptions,
  ) {}

  private goalNodes: GoalNode[];
  private projectNodes: ProjectNode[];
  private nodes: Node[];
  private rootNodes: Node[];

  build(): Tree {
    this.createNodes();
    this.connectNodes();
    this.findRoots();
    this.sortNodes();

    this.rootNodes = TreeFilter.filter(this.me, this.rootNodes, this.options);
    this.setDepth();

    return this.rootNodes;
  }

  setMeId(meId: string): void {
    this.me.id = meId;
  }

  private createNodes(): void {
    this.goalNodes = this.createGoalNodes();
    this.projectNodes = this.createProjectNodes();

    this.nodes = [...this.goalNodes, ...this.projectNodes];
  }

  private createGoalNodes(): GoalNode[] {
    if (this.options.showGoals) {
      return this.allGoals.map((g) => new GoalNode(g));
    } else {
      return [];
    }
  }

  private createProjectNodes(): ProjectNode[] {
    if (this.options.showProjects) {
      return this.allProjects.map((p) => new ProjectNode(p));
    } else {
      return [];
    }
  }

  private connectNodes(): void {
    this.nodes.forEach((n) => {
      const children = this.nodes.filter((c) => compareIds(c.parentId, n.id));
      const parent = this.nodes.find((c) => compareIds(n.parentId, c.id));

      n.addChildren(children);
      n.setParent(parent);
    });
  }

  private findRoots(): void {
    if (this.options.spaceId) {
      this.rootNodes = this.rootNodesForSpace();
    } else if (this.options.personId) {
      this.rootNodes = this.rootNodesForPerson();
    } else if (this.options.goalId) {
      this.rootNodes = this.rootNodesForGoal();
    } else {
      this.rootNodes = this.rootNodesInTheCompany();
    }
  }

  private rootNodesForSpace(): Node[] {
    return this.nodes
      .filter((n) => n.hasNoParent())
      .filter((n) => n.isFromSpace(this.options.spaceId!) || n.hasDescendantFromSpace(this.options.spaceId!));
  }

  private rootNodesForPerson(): Node[] {
    return this.nodes.filter(
      (n) =>
        compareIds(n.champion?.id, this.options.personId!) &&
        n.hasNoParentWith((node) => compareIds(node.champion?.id, this.options.personId)),
    );
  }

  private rootNodesInTheCompany(): Node[] {
    return this.nodes.filter((n) => n.hasNoParent());
  }

  private rootNodesForGoal(): Node[] {
    return this.nodes.filter((n) => compareIds(n.parentId, this.options.goalId));
  }

  private setDepth(): void {
    TreeBuilder.setDepth(this.rootNodes, 0);
  }

  private sortNodes(): void {
    TreeBuilder.sortNodes(this.rootNodes, this.options.sortColumn, this.options.sortDirection);
  }

  // Recursive utility functions

  static sortNodes(nodes: Node[], column: SortColumn, direction: SortDirection): Node[] {
    let res = nodes.sort((a, b) => a.compare(b, column, direction));

    res.forEach((n) => {
      n.children = TreeBuilder.sortNodes(n.children, column, direction);
    });

    return res;
  }

  static setDepth(nodes: Node[], depth: number): void {
    nodes.forEach((n) => {
      n.depth = depth;
      TreeBuilder.setDepth(n.children, depth + 1);
    });
  }
}

class TreeFilter {
  static filter(me: Person, nodes: Node[], options: TreeOptions): Node[] {
    return new TreeFilter(me, options).filter(nodes);
  }

  private options: TreeOptions;
  private me: Person;

  constructor(me: Person, options: TreeOptions) {
    this.me = me;
    this.options = options;
  }

  filter(nodes: Node[]): Node[] {
    return nodes.map((n) => this.filterChildren(n)).filter((n) => this.isNodeVisible(n) || n.children.length > 0);
  }

  private filterChildren(node: Node): Node {
    node.children = this.filter(node.children);
    return node;
  }

  private isNodeVisible(node: Node): boolean {
    return this.spaceFilter(node) && this.statusFilter(node) && this.timeframeFilter(node) && this.myRoleFilter(node);
  }

  private spaceFilter(node: Node): boolean {
    if (!this.options.spaceId) return true;

    return node.isFromSpace(this.options.spaceId) || node.hasAncestorFromSpace(this.options.spaceId);
  }

  private statusFilter(node: Node): boolean {
    if (this.options.showActive && (node.isActive || node.hasActiveDescendant())) return true;
    if (this.options.showPaused && (node.isPaused || node.hasPausedDescendant())) return true;
    if (this.options.showCompleted && (node.isClosed || node.hasClosedDescendant())) return true;

    return false;
  }

  private timeframeFilter(node: Node): boolean {
    if (!this.options.timeframe) return true;

    return Timeframes.hasOverlap(this.options.timeframe, node.activeTimeframe());
  }

  private myRoleFilter(node: Node): boolean {
    if (this.options.ownedBy === "anyone" && this.options.reviewedBy === "anyone") return true;

    const ownedByMe = this.options.ownedBy === "me" && compareIds(node.champion?.id, this.me.id);
    const reviewedByMe = this.options.reviewedBy === "me" && compareIds(node.reviewer?.id, this.me.id);

    return ownedByMe || reviewedByMe;
  }
}
