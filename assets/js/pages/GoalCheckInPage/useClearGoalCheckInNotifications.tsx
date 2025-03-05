import { useClearNotificationsOnLoad } from "@/features/notifications";
import { assertPresent } from "@/utils/assertions";
import { useLoadedData } from "./loader";

export function useClearGoalCheckInNotifications() {
  const { update } = useLoadedData();

  assertPresent(update.notifications, "Update notifications must be defined");

  return useClearNotificationsOnLoad(update.notifications);
}
