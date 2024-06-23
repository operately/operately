import { Goal } from ".";

import * as Spaces from "@/models/spaces";

interface GoalGroup {
  space: Spaces.Space;
  goals: Goal[];
}

export function groupBySpace(goals: Goal[]): GoalGroup[] {
  const groups: GoalGroup[] = [];

  for (const goal of goals) {
    const space = goal.space;

    if (!groups.find((group) => group.space.id === space!.id)) {
      groups.push({
        space: space as Spaces.Space,
        goals: [],
      });
    }

    groups.find((group) => group!.space!.id === space!.id)!.goals.push(goal);
  }

  groups.sort((a, b) => {
    if (a.space.isCompanySpace) return -100;
    if (b.space.isCompanySpace) return 100;

    return a.space.name!.localeCompare(b.space.name!);
  });

  return groups;
}
