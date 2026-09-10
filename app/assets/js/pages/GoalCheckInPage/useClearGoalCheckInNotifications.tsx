import { useReadNotificationsOnLoad } from "@/models/notifications/notificationLifecycle";
import { invalidateGoalInteractionQueries } from "@/models/goals/goalLifecycle";
import { assertPresent } from "@/utils/assertions";
import { useLoadedData } from "./loader";

export function useClearGoalCheckInNotifications() {
  const { update, goal } = useLoadedData();
  assertPresent(update.notifications, "Update notifications must be defined");

  const context = {
    goalId: goal.id,
    resourceId: update.id,
    resourceType: "goal_update" as const,
  };
  useReadNotificationsOnLoad(update.notifications, (client) =>
    invalidateGoalInteractionQueries(client, context, "none"),
  );
}
