import Api, { ProjectRetrospective } from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { useQueryClient } from "@tanstack/react-query";

export async function loader({ params }) {
  const queryInput = {
    projectId: params.projectID,
    includeAuthor: true,
    includeProject: true,
    includeClosedAt: true,
    includePermissions: true,
    includeReactions: true,
    includePotentialSubscribers: true,
    includeSubscriptionsList: true,
    includeUnreadNotifications: true,
  };

  const { retrospective } = await Api.projects.getRetrospectiveQuery(queryInput);

  if (!retrospective?.id) {
    throw new Error(`Retrospective data is unavailable for project "${queryInput.projectId}"`);
  }

  const subscriptionInput = {
    resourceId: retrospective.id,
    resourceType: "project_retrospective" as const,
  };

  await Api.notifications.isSubscribedQuery(subscriptionInput);

  return { queryInput, subscriptionInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData(): { retrospective: ProjectRetrospective; isCurrentUserSubscribed: boolean } {
  const { queryInput, subscriptionInput } = Pages.useLoadedData<LoaderResult>();
  const { data } = useLoadedQuery(Api.projects.getRetrospectiveQueryOptions(queryInput));
  const { data: subscription } = useLoadedQuery(Api.notifications.isSubscribedQueryOptions(subscriptionInput));

  if (!data?.retrospective) {
    throw new Error(`Retrospective data is unavailable for project "${queryInput.projectId}"`);
  }

  if (!subscription) {
    throw new Error(`Subscription status is unavailable for retrospective "${subscriptionInput.resourceId}"`);
  }

  return {
    retrospective: data.retrospective,
    isCurrentUserSubscribed: subscription.subscribed,
  };
}

export function useRefresh() {
  const queryClient = useQueryClient();
  const { queryInput, subscriptionInput } = Pages.useLoadedData<LoaderResult>();

  return () => {
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: Api.projects.getRetrospectiveQueryKey(queryInput) }),
      queryClient.invalidateQueries({ queryKey: Api.notifications.isSubscribedQueryKey(subscriptionInput) }),
    ]);
  };
}
