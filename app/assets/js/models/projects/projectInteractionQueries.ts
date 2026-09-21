import Api, { type Activity, type CompaniesGetActivityResult, type CompaniesListActivitiesInput } from "@/api";
import { compareIds } from "@/routes/paths";
import type { QueryClient, QueryKey } from "@tanstack/react-query";

type ProjectInteractionContext = {
  projectId: string;
  resourceId: string;
  resourceType: "project_check_in" | "project_discussion" | "project_retrospective";
  activityId?: string;
  spaceId?: string;
};

/** Refresh a comment's resource and related views, including alternate query inputs. */
export async function invalidateProjectInteractionQueries(
  client: QueryClient,
  context: ProjectInteractionContext,
  refetchType: "active" | "none" = "active",
) {
  const { resourceId, resourceType, projectId } = context;
  const commentsPrefix = Api.comments.listQueryKeyPrefix();
  const subscriptionPrefix = Api.notifications.isSubscribedQueryKeyPrefix();
  const subscriptionType = resourceType === "project_discussion" ? "comment_thread" : resourceType;

  function invalidateResource(queryKey: QueryKey, field: string, id: string) {
    return client.invalidateQueries({
      queryKey,
      refetchType,
      predicate: (query) => {
        const input = query.queryKey[queryKey.length] as Record<string, string> | undefined;
        return compareIds(input?.[field], id);
      },
    });
  }

  await Promise.all([
    client.invalidateQueries({
      queryKey: commentsPrefix,
      refetchType,
      predicate: (query) => {
        const input = query.queryKey[commentsPrefix.length] as { entityId?: string; entityType?: string } | undefined;
        return input?.entityType === resourceType && compareIds(input.entityId, resourceId);
      },
    }),
    client.invalidateQueries({
      queryKey: subscriptionPrefix,
      refetchType,
      predicate: (query) => {
        const input = query.queryKey[subscriptionPrefix.length] as
          | { resourceId?: string; resourceType?: string }
          | undefined;
        return input?.resourceType === subscriptionType && compareIds(input.resourceId, resourceId);
      },
    }),
    invalidateResource(Api.projects.getQueryKeyPrefix(), "id", projectId),
    ...(resourceType === "project_check_in"
      ? [
          invalidateResource(Api.projects.getCheckInQueryKeyPrefix(), "id", resourceId),
          invalidateResource(Api.projects.listCheckInsQueryKeyPrefix(), "projectId", projectId),
        ]
      : resourceType === "project_discussion"
        ? [
            invalidateResource(Api.projects.getDiscussionQueryKeyPrefix(), "id", resourceId),
            invalidateResource(Api.projects.listDiscussionsQueryKeyPrefix(), "projectId", projectId),
          ]
        : [invalidateResource(Api.projects.getRetrospectiveQueryKeyPrefix(), "projectId", projectId)]),
    invalidateRelatedActivities(client, context, refetchType),
  ]);
}

function invalidateRelatedActivities(
  client: QueryClient,
  context: ProjectInteractionContext,
  refetchType: "active" | "none",
) {
  const activityPrefix = Api.companies.getActivityQueryKeyPrefix();
  const feedPrefix = Api.companies.listActivitiesQueryKeyPrefix();
  const activityIds = new Set(context.activityId ? [context.activityId] : []);

  // Discover matching IDs first so variants without cached response data are invalidated too.
  for (const query of client.getQueryCache().findAll({ queryKey: activityPrefix })) {
    const activity = (query.state.data as CompaniesGetActivityResult | undefined)?.activity;
    if (activity && isRelatedActivity(activity, context)) activityIds.add(activity.id);
  }

  return Promise.all([
    client.invalidateQueries({
      queryKey: activityPrefix,
      refetchType,
      predicate: (query) => {
        const input = query.queryKey[activityPrefix.length] as { id?: string } | undefined;
        return [...activityIds].some((id) => compareIds(input?.id, id));
      },
    }),
    client.invalidateQueries({
      queryKey: feedPrefix,
      refetchType,
      predicate: (query) => {
        const input = query.queryKey[feedPrefix.length] as CompaniesListActivitiesInput | undefined;
        if (input?.scopeType === "project") return compareIds(input.scopeId, context.projectId);
        if (input?.scopeType === "goal") return false;
        if (input?.scopeType === "space" && context.spaceId) return compareIds(input.scopeId, context.spaceId);
        // Company/person feeds can include newly created comment activities.
        return true;
      },
    }),
  ]);
}

function isRelatedActivity(activity: Activity, context: ProjectInteractionContext) {
  const { resourceId, resourceType, projectId } = context;
  if (resourceType === "project_discussion" && compareIds(activity.commentThread?.id, resourceId)) return true;

  const content = activity.content;

  if (!content) return false;
  if ("activity" in content && content.activity) return isRelatedActivity(content.activity, context);

  switch (resourceType) {
    case "project_discussion":
      return "discussion" in content && compareIds(content.discussion?.id, resourceId);
    case "project_check_in":
      return (
        ("checkIn" in content && compareIds(content.checkIn?.id, resourceId)) ||
        ("checkInId" in content && compareIds(content.checkInId, resourceId))
      );
    case "project_retrospective":
      return (
        ("retrospective" in content && compareIds(content.retrospective?.id, resourceId)) ||
        ("retrospectiveId" in content && compareIds(content.retrospectiveId, resourceId)) ||
        ("__typename" in content &&
          content.__typename === "activity_content_project_closed" &&
          compareIds(content.project?.id, projectId))
      );
  }
}
