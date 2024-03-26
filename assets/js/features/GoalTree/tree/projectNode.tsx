import { SortColumn, SortDirection } from "./";

import { Project } from "@/models/projects";
import { Paths } from "@/routes/paths";
import { Node } from "./node";

import { match } from "ts-pattern";

import * as People from "@/models/people";
import * as Time from "@/utils/time";

export class ProjectNode implements Node {
  public id: string;
  public type: "goal" | "project";
  public name: string;
  public linkTo: string;
  public project: Project;
  public children: Node[];
  public depth: number;
  public hasChildren: boolean;
  public champion: People.Person;
  public lastCheckInDate: Date | null;
  public progress: number;
  public spaceId: string;

  constructor(project: Project, depth: number = 0) {
    this.id = project.id;
    this.type = "project";
    this.name = project.name;
    this.linkTo = Paths.projectPath(project.id);
    this.project = project;
    this.depth = depth;
    this.children = [];
    this.hasChildren = false;
    this.champion = project.champion!;
    this.lastCheckInDate = Time.parse(project.lastCheckIn?.insertedAt);
    this.progress = this.calculateProgress();
    this.spaceId = project.space.id;
  }

  childrenInfoLabel(): string | null {
    return null;
  }

  compare(b: ProjectNode, column: SortColumn, direction: SortDirection): number {
    const result = match(column)
      .with("name", () => this.name.localeCompare(b.name))
      .with("timeframe", () => Time.compareAsc(this.project.deadline, b.project.deadline))
      .with("progress", () => this.progress - b.progress)
      .with("lastCheckIn", () => Time.compareAsc(this.lastCheckInDate!, b.lastCheckInDate!))
      .with("champion", () => this.champion.fullName.localeCompare(b.champion.fullName))
      .exhaustive();

    const directionFactor = direction === "asc" ? 1 : -1;
    return result * directionFactor;
  }

  private calculateProgress(): number {
    const completedMilestones = this.project.milestones!.filter((m) => m!.status === "done").length;
    const totalMilestones = this.project.milestones!.length;

    return (completedMilestones / totalMilestones) * 100;
  }
}
