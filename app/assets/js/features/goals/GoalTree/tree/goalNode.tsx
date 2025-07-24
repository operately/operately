import plurarize from "@/utils/plurarize";

import { GoalProgressUpdate } from "@/api";
import { Goal } from "@/models/goals";
import { Node } from "./node";

import * as Spaces from "@/models/spaces";
import { assertPresent } from "@/utils/assertions";
import * as Time from "@/utils/time";

export class GoalNode extends Node {
  public goal: Goal;
  public lastCheckIn: GoalProgressUpdate | null | undefined;

  constructor(goal: Goal) {
    assertPresent(goal.space, "space must be present in goal");

    super();

    this.goal = goal;

    this.id = goal.id!;
    this.parentId = goal.parentGoalId!;

    this.type = "goal";
    this.name = goal.name!;
    this.champion = goal.champion!;
    this.reviewer = goal.reviewer!;

    this.isActive = !goal.isClosed;
    this.isPaused = false;
    this.isClosed = goal.isClosed!;

    this.progress = this.goal.progressPercentage!;

    this.lastCheckIn = goal.lastCheckIn;
    this.lastCheckInDate = Time.parseDate(goal.lastCheckIn?.insertedAt);
    this.lastCheckInStatus = goal.lastCheckIn ? goal.lastCheckIn.status! : "on_track";

    this.space = goal.space as Spaces.Space;
    this.spaceId = goal.space.id!;

    this.startedAt = this.calcStartedAt();
  }

  calcStartedAt(): Date {
    if (this.goal.timeframe) {
      return Time.parseDate(this.goal.timeframe.contextualEndDate?.date)!;
    } else {
      return Time.parse(this.goal.insertedAt)!;
    }
  }

  linkTo(paths): string {
    return paths.goalPath(this.goal.id!);
  }

  childrenInfoLabel(): string {
    const subGoals = this.totalNestedSubGoals();
    const projects = this.totalNestedProjects();

    if (subGoals > 0 && projects > 0) {
      return `${plurarize(subGoals, "subgoal", "subgoals")} and ${plurarize(projects, "project", "projects")}`;
    } else if (subGoals > 0) {
      return plurarize(subGoals, "subgoal", "subgoals");
    } else if (projects > 0) {
      return plurarize(projects, "project", "projects");
    } else {
      return "";
    }
  }

  totalNestedSubGoals(): number {
    return (
      this.children.filter((n) => n.type === "goal").length +
      this.children.filter((n) => n.type === "goal").reduce((acc, n) => acc + (n as GoalNode).totalNestedSubGoals(), 0)
    );
  }

  totalNestedProjects(): number {
    return this.children.filter((n) => n.type === "project").length;
  }
}
