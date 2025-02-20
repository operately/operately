import * as Goals from "@/models/goals";


export function useLoadedData(goalId: string) {
  return Goals.useGetGoal({
    id: goalId,
    includeSpace: true,
    includeTargets: true,
    includeProjects: true,
    includeLastCheckIn: true,
    includePermissions: true,
    includeUnreadNotifications: true,
  });
}
