import plurarize from "@/utils/plurarize";

import { GoalProgressUpdate } from "@/api";
import { Goal } from "@/models/goals";
import { DeprecatedPaths } from "@/routes/paths";
import { Node } from "./node";

import * as Spaces from "@/models/spaces";
import { assertPresent } from "@/utils/assertions";
import * as Time from "@/utils/time";
import * as Timeframes from "@/utils/timeframes";

export class GoalNode extends Node {
  public goal: Goal;
  public lastCheckIn: GoalProgressUpdate | null | undefined;
  private timeframe: Timeframes.Timeframe | null;

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

    this.timeframe = this.calcTimeframe();
    this.startedAt = this.calcStartedAt();
  }

  calcStartedAt(): Date {
    if (this.goal.timeframe) {
      return Timeframes.parse(this.goal.timeframe).startDate!;
    } else {
      return Time.parse(this.goal.insertedAt)!;
    }
  }

  calcTimeframe(): Timeframes.Timeframe | null {
    if (this.goal.timeframe) {
      return Timeframes.parse(this.goal.timeframe);
    } else {
      return null;
    }
  }

  activeTimeframe(): Timeframes.Timeframe | null {
    if (this.timeframe) {
      if (this.isClosed) {
        return this.timeframe;
      } else {
        return {
          startDate: this.startedAt,
          endDate: new Date(),
          type: "days",
        };
      }
    } else {
      return null;
    }
  }

  linkTo(): string {
    return DeprecatedPaths.goalPath(this.goal.id!);
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

  compareTimeframe(b: GoalNode): number {
    const timeframeA = this.timeframe;
    const timeframeB = b.timeframe;

    if (!timeframeA && !timeframeB) return 0;
    if (!timeframeA) return -1; // nulls first
    if (!timeframeB) return 1; // nulls first

    return Time.compareAsc(timeframeA.endDate, timeframeB.endDate);
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
