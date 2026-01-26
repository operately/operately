import * as Pages from "@/components/Pages";
import * as ProjectCheckIns from "@/models/projectCheckIns";
import { isSubscribedToResource } from "@/models/subscriptions";

interface LoaderResult {
  checkIn: ProjectCheckIns.ProjectCheckIn;
  isCurrentUserSubscribed: boolean;
}

export async function loader({ params }): Promise<LoaderResult> {
  const [checkIn, subscriptionStatus] = await Promise.all([
    ProjectCheckIns.getProjectCheckIn({
    id: params.id,
    includeProject: true,
    includeSpace: true,
    includeAuthor: true,
    includeReactions: true,
    includeAcknowledgedBy: true,
    includeSubscriptionsList: true,
    includePotentialSubscribers: true,
    includeUnreadNotifications: true,
  }).then((data) => data.projectCheckIn),
    isSubscribedToResource({
      resourceId: params.id,
      resourceType: "project_check_in",
    }),
  ]);

  return {
    checkIn,
    isCurrentUserSubscribed: subscriptionStatus.subscribed,
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function useRefresh() {
  return Pages.useRefresh();
}
