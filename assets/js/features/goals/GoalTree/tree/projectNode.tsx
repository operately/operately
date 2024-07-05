import * as Time from "@/utils/time";
import * as Spaces from "@/models/spaces";

import { Project } from "@/models/projects";
import { Paths } from "@/routes/paths";
import { Node } from "./node";

export class ProjectNode extends Node {
  public project: Project;

  constructor(project: Project) {
    super();

    this.project = project;
    this.parentId = project.goal?.id!;

    this.id = project.id!;
    this.type = "project";
    this.name = project.name!;

    this.champion = project.champion!;
    this.space = project.space as Spaces.Space;
    this.isClosed = !!project.closedAt;
    this.progress = this.calculateProgress();
    this.lastCheckInDate = Time.parseDate(project.lastCheckIn?.insertedAt);
    this.spaceId = project.space!.id!;
  }

  linkTo(): string {
    return Paths.projectPath(this.project!.id!);
  }

  childrenInfoLabel(): string | null {
    return null;
  }

  compareTimeframe(b: Node): number {
    const aTime = Time.parseDate(this.project.deadline);
    const bTime = Time.parseDate((b as ProjectNode).project.deadline);

    return Time.compareAsc(aTime, bTime);
  }

  private calculateProgress(): number {
    const completedMilestones = this.project.milestones!.filter((m) => m!.status === "done").length;
    const totalMilestones = this.project.milestones!.length;

    return (completedMilestones / totalMilestones) * 100;
  }
}
