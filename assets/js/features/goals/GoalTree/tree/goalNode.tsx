import plurarize from "@/utils/plurarize";

import { Node } from "./node";
import { Goal } from "@/models/goals";
import { GoalProgressUpdate } from "@/api";
import { Paths } from "@/routes/paths";

import * as Time from "@/utils/time";
import * as Timeframes from "@/utils/timeframes";
import * as Spaces from "@/models/spaces";

export class GoalNode extends Node {
  public goal: Goal;
  public lastCheckIn: GoalProgressUpdate | null | undefined;

  constructor(goal: Goal) {
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
    this.lastCheckInDate = Time.parseDate(goal.lastCheckIn?.insertedAt);
    this.lastCheckIn = goal.lastCheckIn;

    this.space = goal.space as Spaces.Space;
    this.spaceId = goal.space!.id!;

    this.startedAt = Timeframes.parse(goal.timeframe!).startDate!;
  }

  activeTimeframe(): Timeframes.Timeframe {
    if (this.isClosed) {
      return Timeframes.parse(this.goal.timeframe!);
    } else {
      return {
        startDate: this.startedAt,
        endDate: new Date(),
        type: "days",
      };
    }
  }

  linkTo(): string {
    return Paths.goalPath(this.goal.id!);
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
    const timeframeA = Timeframes.parse(this.goal.timeframe!);
    const timeframeB = Timeframes.parse(b.goal.timeframe!);

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
