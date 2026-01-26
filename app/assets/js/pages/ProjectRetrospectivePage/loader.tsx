import * as Pages from "@/components/Pages";
import * as Projects from "@/models/projects";
import { isSubscribedToResource } from "@/models/subscriptions";

interface LoaderResult {
  retrospective: Projects.ProjectRetrospective;
  isCurrentUserSubscribed: boolean;
}

export async function loader({ params }): Promise<LoaderResult> {
  const retrospective = await Projects.getProjectRetrospective({
    projectId: params.projectID,
    includeAuthor: true,
    includeProject: true,
    includeClosedAt: true,
    includePermissions: true,
    includeReactions: true,
    includePotentialSubscribers: true,
    includeSubscriptionsList: true,
    includeUnreadNotifications: true,
  }).then((data) => data.retrospective);

  const subscriptionStatus = await isSubscribedToResource({
    resourceId: retrospective.id,
    resourceType: "project_retrospective",
  });

  return {
    retrospective,
    isCurrentUserSubscribed: subscriptionStatus.subscribed,
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function useRefresh() {
  return Pages.useRefresh();
}
