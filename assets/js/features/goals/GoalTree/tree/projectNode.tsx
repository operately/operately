import * as Time from "@/utils/time";

import { Project } from "@/models/projects";
import { Paths } from "@/routes/paths";
import { Node } from "./node";

export class ProjectNode extends Node {
  public project: Project;

  constructor(project: Project, depth: number = 0) {
    super();

    this.id = project.id;
    this.type = "project";
    this.depth = depth;
    this.name = project.name;
    this.sortColumn = "name";
    this.sortDirection = "desc";
    this.showCompleted = false;
    this.project = project;

    this.linkTo = Paths.projectPath(project.id);
    this.champion = project.champion!;
    this.children = [];
    this.hasChildren = false;
    this.space = project.space;
    this.isClosed = !!project.closedAt;
    this.progress = this.calculateProgress();
    this.lastCheckInDate = Time.parseDate(project.lastCheckIn?.insertedAt);
    this.spaceId = project.space.id;
  }

  childrenInfoLabel(): string | null {
    return null;
  }

  compareTimeframe(b: Node): number {
    return Time.compareAsc(this.project.deadline, (b as ProjectNode).project.deadline);
  }

  private calculateProgress(): number {
    const completedMilestones = this.project.milestones!.filter((m) => m!.status === "done").length;
    const totalMilestones = this.project.milestones!.length;

    return (completedMilestones / totalMilestones) * 100;
  }
}
