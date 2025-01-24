import type { SortColumn, SortDirection } from "./";

import * as People from "@/models/people";
import * as Spaces from "@/models/spaces";
import * as Timeframes from "@/utils/timeframes";
import * as Time from "@/utils/time";

import { compareIds } from "@/routes/paths";

type NodeTypes = "goal" | "project";

import type { GoalNode } from "./goalNode";
import type { ProjectNode } from "./projectNode";

import { match } from "ts-pattern";

export abstract class Node {
  public id: string;
  public parentId: string | undefined;

  public type: NodeTypes;
  public depth: number;
  public name: string;
  public sortColumn: SortColumn;
  public sortDirection: SortDirection;
  public showCompleted: boolean;
  public status: string;

  public champion: People.Person;
  public reviewer?: People.Person;
  public parent: Node | undefined;
  public children: Node[];
  public hasChildren: boolean;
  public space: Spaces.Space;

  public isActive: boolean;
  public isPaused: boolean;
  public isClosed: boolean;

  public progress: number;
  public lastCheckInDate: Date | null;
  public spaceId: string;

  public startedAt: Date;

  abstract childrenInfoLabel(): string | null;
  abstract compareTimeframe(b: Node): number;
  abstract linkTo(): string;
  abstract activeTimeframe(): Timeframes.Timeframe;

  asGoalNode() {
    return this as unknown as GoalNode;
  }

  asProjectNode() {
    return this as unknown as ProjectNode;
  }

  hasNoParentWith(predicate: (n: Node) => boolean): boolean {
    let current: Node | undefined = this.parent;

    while (current) {
      if (predicate(current)) return false;
      current = current.parent;
    }

    return true;
  }

  hasNoParent(): boolean {
    return this.parent === undefined;
  }

  isFromSpace(spaceId: string): boolean {
    return compareIds(this.spaceId, spaceId);
  }

  hasDescendantFromSpace(spaceId: string): boolean {
    return this.children.some((child) => child.isFromSpace(spaceId) || child.hasDescendantFromSpace(spaceId));
  }

  hasAncestorFromSpace(spaceId: string): boolean {
    if (!this.parent) return false;

    return this.parent.isFromSpace(spaceId) || this.parent.hasAncestorFromSpace(spaceId);
  }

  hasActiveDescendant(): boolean {
    return this.children.some((child) => child.isActive || child.hasActiveDescendant());
  }

  hasPausedDescendant(): boolean {
    return this.children.some((child) => child.isPaused || child.hasPausedDescendant());
  }

  hasClosedDescendant(): boolean {
    return this.children.some((child) => child.isClosed || child.hasClosedDescendant());
  }

  setParent(parent: Node | undefined): void {
    this.parent = parent;
    this.parentId = parent?.id;
  }

  addChildren(children: Node[]): void {
    this.children = children;
    this.hasChildren = children.length > 0;
  }

  compare(b: Node, column: SortColumn, direction: SortDirection): number {
    if (this.type === "goal" && b.type === "project") return -1;
    if (this.type === "project" && b.type === "goal") return 1;

    if (this.isClosed && !b.isClosed) return 1;
    if (!this.isClosed && b.isClosed) return -1;

    const result = match(column)
      .with("name", () => this.compareName(b))
      .with("timeframe", () => this.compareTimeframe(b))
      .with("lastCheckIn", () => this.compareLastCheckIn(b))
      .with("champion", () => this.compareChampion(b))
      .with("space", () => this.compareSpace(b))
      .with("progress", () => this.compareProgress(b))
      .exhaustive();

    const directionFactor = direction === "asc" ? 1 : -1;
    return result * directionFactor;
  }

  compareChampion(b: Node): number {
    return this.champion.fullName!.localeCompare(b.champion.fullName!);
  }

  compareName(b: Node): number {
    return this.name.localeCompare(b.name);
  }

  compareProgress(b: Node): number {
    if (this.isClosed && !b.isClosed) return -1;
    if (!this.isClosed && b.isClosed) return 1;
    if (this.isClosed || b.isClosed) return 1;

    return this.progress - b.progress;
  }

  compareSpace(b: Node): number {
    if (this.space.isCompanySpace && !b.space.isCompanySpace) return -1;
    if (!this.space.isCompanySpace && b.space.isCompanySpace) return 1;

    return this.space.name!.localeCompare(b.name);
  }

  compareLastCheckIn(b: Node): number {
    return Time.compareAsc(this.lastCheckInDate!, b.lastCheckInDate!);
  }
}
