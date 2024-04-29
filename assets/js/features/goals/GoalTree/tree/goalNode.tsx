import { Node } from "./node";
import { Goal } from "@/models/goals";
import { Paths } from "@/routes/paths";

import * as Time from "@/utils/time";
import * as Timeframes from "@/utils/timeframes";

export class GoalNode extends Node {
  public goal: Goal;

  constructor(goal: Goal) {
    super();

    this.goal = goal;

    this.id = goal.id;
    this.parentId = goal.parentGoalId!;

    this.type = "goal";
    this.name = goal.name;
    this.champion = goal.champion!;
    this.isClosed = goal.isClosed;
    this.progress = this.goal.progressPercentage;
    this.lastCheckInDate = Time.parseDate(goal.lastCheckIn?.insertedAt);

    this.space = goal.space;
    this.spaceId = goal.space.id;
  }

  linkTo(): string {
    return Paths.goalPath(this.goal.id);
  }

  childrenInfoLabel(): string {
    const subGoals = this.totalNestedSubGoals();
    const projects = this.totalNestedProjects();

    if (subGoals > 0 && projects > 0) {
      return pluralize(subGoals, "subgoal") + ", " + pluralize(projects, "project");
    } else if (subGoals > 0) {
      return pluralize(subGoals, "subgoal");
    } else if (projects > 0) {
      return pluralize(projects, "project");
    } else {
      return "";
    }
  }

  compareTimeframe(b: GoalNode): number {
    const timeframeA = Timeframes.parse(this.goal.timeframe);
    const timeframeB = Timeframes.parse(b.goal.timeframe);

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

function pluralize(count: number, word: string): string {
  return count === 1 ? `${count} ${word}` : `${count} ${word}s`;
}
