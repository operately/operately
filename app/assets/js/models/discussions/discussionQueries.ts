import Api from "@/api";
import { compareIds } from "@/routes/paths";
import { type QueryClient } from "@tanstack/react-query";

type RefetchType = "active" | "none";
interface DiscussionContext {
  spaceId: string;
  discussionId: string;
}

export async function invalidateDiscussionDetailQueries(
  client: QueryClient,
  discussionId: string,
  refetchType: RefetchType = "active",
): Promise<void> {
  await Promise.all([
    invalidateMatchingQueries(client, Api.spaces.getDiscussionQueryKeyPrefix(), { id: discussionId }, refetchType),
    invalidateMatchingQueries(
      client,
      Api.notifications.isSubscribedQueryKeyPrefix(),
      { resourceId: discussionId },
      refetchType,
      { resourceType: "message" },
    ),
  ]);
}

export async function invalidateDiscussionListQueries(
  client: QueryClient,
  spaceId: string,
  refetchType: RefetchType = "active",
): Promise<void> {
  await Promise.all([
    invalidateMatchingQueries(client, Api.spaces.listDiscussionsQueryKeyPrefix(), { spaceId }, refetchType),
    invalidateMatchingQueries(client, Api.spaces.getQueryKeyPrefix(), { id: spaceId }, refetchType),
    invalidateMatchingQueries(client, Api.spaces.listToolsQueryKeyPrefix(), { spaceId }, refetchType),
    client.invalidateQueries({ queryKey: Api.companies.listActivitiesQueryKeyPrefix(), refetchType }),
  ]);
}

export async function invalidateDiscussionQueries(
  client: QueryClient,
  context: DiscussionContext,
  refetchType: RefetchType = "active",
): Promise<void> {
  await Promise.all([
    invalidateDiscussionDetailQueries(client, context.discussionId, refetchType),
    invalidateDiscussionListQueries(client, context.spaceId, refetchType),
  ]);
}

export async function invalidateDiscussionInteractionQueries(
  client: QueryClient,
  context: DiscussionContext,
  refetchType: RefetchType = "active",
): Promise<void> {
  await Promise.all([
    invalidateDiscussionQueries(client, context, refetchType),
    invalidateMatchingQueries(
      client,
      Api.comments.listQueryKeyPrefix(),
      { entityId: context.discussionId },
      refetchType,
      { entityType: "message" },
    ),
  ]);
}

async function invalidateMatchingQueries(
  client: QueryClient,
  queryKey: readonly unknown[],
  ids: Record<string, string>,
  refetchType: RefetchType,
  fields: Record<string, string> = {},
): Promise<void> {
  await client.invalidateQueries({
    queryKey,
    refetchType,
    predicate: (query) => {
      const input = query.queryKey[queryKey.length] as Record<string, unknown> | undefined;
      return (
        Object.entries(ids).every(([key, id]) => {
          const value = input?.[key];
          return typeof value === "string" && compareIds(value, id);
        }) && Object.entries(fields).every(([key, value]) => input?.[key] === value)
      );
    },
  });
}
