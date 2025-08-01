import * as api from "@/api";

export type Goal = api.Goal;
export type Target = api.Target;
export type Timeframe = api.Timeframe;

export {
  createGoalDiscussion,
  getGoal,
  getGoals,
  listGoalContributors,
  useArchiveGoal,
  useChangeGoalParent,
  useCloseGoal,
  useConnectGoalToProject,
  useCreateGoal,
  useDeleteGoal,
  useDisconnectGoalFromProject,
  useEditGoalDiscussion,
  useGetGoals,
  useReopenGoal,
} from "@/api";

export { filterPossibleParentGoals } from "./filterPossibleParentGoals";

export function targetProgressPercentage(target: Target, clamped: boolean = true): number {
  const from = target.from!;
  const to = target.to!;
  const value = target.value!;

  let percentage: number;
  if (from < to) {
    percentage = ((value - from) / (to - from)) * 100;
  } else {
    percentage = ((from - value) / (from - to)) * 100;
  }

  if (clamped) {
    return Math.max(0, Math.min(100, percentage));
  }

  return percentage;
}

export function accessLevelsAsStrings(levels: api.AccessLevels): {
  company: "no_access" | "view" | "comment" | "edit" | "full";
  space: "no_access" | "view" | "comment" | "edit" | "full";
} {
  // space level is always at least as high as company level
  const spaceLevel = levels.company! > levels.space! ? levels.company! : levels.space!;

  return {
    company: accessLevelAsString(levels.company!),
    space: accessLevelAsString(spaceLevel),
  };
}

function accessLevelAsString(level: number): "no_access" | "view" | "comment" | "edit" | "full" {
  switch (level) {
    case 0:
      return "no_access";
    case 10:
      return "view";
    case 40:
      return "comment";
    case 70:
      return "edit";
    case 100:
      return "full";
    default:
      throw new Error(`Unknown access level: ${level}`);
  }
}

export function accessLevelAsNumber(level: "no_access" | "view" | "comment" | "edit" | "full"): number {
  switch (level) {
    case "no_access":
      return 0;
    case "view":
      return 10;
    case "comment":
      return 40;
    case "edit":
      return 70;
    case "full":
      return 100;
    default:
      throw new Error(`Unknown access level: ${level}`);
  }
}

export function accessLevelsAsNumbers(levels: {
  company: "no_access" | "view" | "comment" | "edit" | "full";
  space: "no_access" | "view" | "comment" | "edit" | "full";
}): api.AccessLevels {
  return {
    company: accessLevelAsNumber(levels.company),
    space: accessLevelAsNumber(levels.space),
  };
}
