import Api, { ProjectCheckIn } from "@/api";
import * as Pages from "@/components/Pages";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export async function loader({ params }) {
  const queryInput = {
    id: params.id,
    includeProject: true,
    includeSpace: true,
    includeAuthor: true,
    includeReactions: true,
    includeAcknowledgedBy: true,
    includeSubscriptionsList: true,
    includePotentialSubscribers: true,
    includeUnreadNotifications: true,
  };

  const subscriptionInput = {
    resourceId: params.id,
    resourceType: "project_check_in" as const,
  };

  await Promise.all([Api.projects.getCheckInQuery(queryInput), Api.notifications.isSubscribedQuery(subscriptionInput)]);

  return { queryInput, subscriptionInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData(): { checkIn: ProjectCheckIn; isCurrentUserSubscribed: boolean } {
  const { queryInput, subscriptionInput } = Pages.useLoadedData<LoaderResult>();
  const { data } = useQuery(Api.projects.getCheckInQueryOptions(queryInput));
  const { data: subscription } = useQuery(Api.notifications.isSubscribedQueryOptions(subscriptionInput));

  if (!data?.projectCheckIn) {
    throw new Error(`Check-in data is unavailable for check-in "${queryInput.id}"`);
  }

  if (!subscription) {
    throw new Error(`Subscription status is unavailable for check-in "${subscriptionInput.resourceId}"`);
  }

  return {
    checkIn: data.projectCheckIn,
    isCurrentUserSubscribed: subscription.subscribed,
  };
}

export function useRefresh() {
  const queryClient = useQueryClient();
  const { queryInput, subscriptionInput } = Pages.useLoadedData<LoaderResult>();

  return () => {
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: Api.projects.getCheckInQueryKey(queryInput) }),
      queryClient.invalidateQueries({ queryKey: Api.notifications.isSubscribedQueryKey(subscriptionInput) }),
    ]);
  };
}
