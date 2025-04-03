import { compareIds } from "@/routes/paths";
import { Goal } from "./index";

export function filterPossibleParentGoals(goals: Goal[], goal: Goal): Goal[] {
  let queue = [goal];

  let nonSelectableGoals = new Set<string>();
  nonSelectableGoals.add(goal.parentGoalId!);

  while (queue.length) {
    const currentGoal = queue.shift();
    nonSelectableGoals.add(currentGoal!.id!);

    goals.forEach((g) => {
      if (compareIds(g.parentGoalId, currentGoal?.id)) {
        queue.push(g);
      }
    });
  }

  return goals.filter((g) => !nonSelectableGoals.has(g.id!));
}
