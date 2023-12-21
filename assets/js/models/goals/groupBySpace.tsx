import { Goal } from ".";

import * as Groups from "@/models/groups";

interface GoalGroup {
  space: Groups.Group;
  goals: Goal[];
}

export function groupBySpace(goals: Goal[]): GoalGroup[] {
  const groups: GoalGroup[] = [];

  for (const goal of goals) {
    const space = goal.space;

    if (!groups.find((group) => group.space.id === space.id)) {
      groups.push({
        space,
        goals: [],
      });
    }

    groups.find((group) => group!.space!.id === space!.id)!.goals.push(goal);
  }

  return groups;
}
