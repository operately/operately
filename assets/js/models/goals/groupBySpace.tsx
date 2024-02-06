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

  groups.sort((a, b) => {
    if (a.space.isCompanySpace) return -100;
    if (b.space.isCompanySpace) return 100;

    if (a.space.name < b.space.name) {
      return -1;
    }

    if (a.space.name > b.space.name) {
      return 1;
    }

    return 0;
  });

  return groups;
}
