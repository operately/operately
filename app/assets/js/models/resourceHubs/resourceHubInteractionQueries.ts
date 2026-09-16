import Api from "@/api";
import { type QueryClient } from "@tanstack/react-query";
import { compareIds } from "@/routes/paths";
import { invalidateResourceHubQueries } from "./resourceHubLifecycle";

interface ResourceHubEntity {
  id: string;
  type: "resource_hub_document" | "resource_hub_file" | "resource_hub_link";
  resourceHubId: string;
  parentFolderId?: string | null;
}

// Refresh the resource and its parent lists together so comment counts and subscriptions stay current.
// Optimistic comment updates and notification clearing pass "none" to defer refetching.
export async function invalidateResourceHubInteractionQueries(
  client: QueryClient,
  entity: ResourceHubEntity,
  refetchType: "active" | "none" = "active",
): Promise<void> {
  const commentsPrefix = Api.comments.listQueryKeyPrefix();
  const subscriptionPrefix = Api.notifications.isSubscribedQueryKeyPrefix();
  const input = {
    documentId: entity.type === "resource_hub_document" ? entity.id : undefined,
    fileId: entity.type === "resource_hub_file" ? entity.id : undefined,
    linkId: entity.type === "resource_hub_link" ? entity.id : undefined,
  };

  await Promise.all([
    invalidateResourceHubQueries(client, input, entity, refetchType),
    client.invalidateQueries({
      queryKey: commentsPrefix,
      refetchType,
      predicate: (query) => {
        const input = query.queryKey[commentsPrefix.length] as { entityId?: string; entityType?: string } | undefined;
        return input?.entityType === entity.type && compareIds(input.entityId, entity.id);
      },
    }),
    client.invalidateQueries({
      queryKey: subscriptionPrefix,
      refetchType,
      predicate: (query) => {
        const input = query.queryKey[subscriptionPrefix.length] as
          | { resourceId?: string; resourceType?: string }
          | undefined;
        return input?.resourceType === entity.type && compareIds(input.resourceId, entity.id);
      },
    }),
  ]);
}
