import { useGetGoal } from "@/api/new_api";

export function useLoadedData(goalId: string) {
  return useGetGoal({
    id: goalId,
    includeSpace: true,
    includeTargets: true,
    includeProjects: true,
    includeLastCheckIn: true,
    includePermissions: true,
    includeUnreadNotifications: true,
  });
}
