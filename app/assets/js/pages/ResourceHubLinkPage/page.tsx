import React from "react";
import { useNavigate } from "react-router";

import { useOptimisticReactions } from "@/models/reactions/useOptimisticReactions";
import { type QueryClient } from "@tanstack/react-query";
import { invalidateResourceHubInteractionQueries } from "@/models/resourceHubs/resourceHubInteractionQueries";
import { resourceHubLandingPath, useDeleteLink } from "@/models/resourceHubs";
import { usePaths } from "@/routes/paths";

import { useCommentSection } from "@/features/CommentSection/useCommentSection";
import { useReadNotificationsOnLoad } from "@/models/notifications/notificationLifecycle";
import { useCurrentSubscriptionsQueryAdapter } from "@/models/subscriptions/useCurrentSubscriptionsQueryAdapter";
import { useBoolState } from "@/hooks/useBoolState";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { assertPresent } from "@/utils/assertions";
import { LinkPage, type ResourceHubLinkType } from "turboui";

import { useLinkPageOptions } from "./Options";
import { useLoadedData, useRefresh } from "./loader";
import { buildLinkPageNavigation } from "./navigation";

export function Page() {
  const { link, isCurrentUserSubscribed } = useLoadedData();
  const paths = usePaths();
  const navigate = useNavigate();
  const refresh = useRefresh();
  const formattedTimePreferences = useFormattedTimePreferences();
  const { mentionedPersonLookup, resolveResourceLinkTitles } = useRichEditorHandlers();
  const [showDeleteModal, toggleDeleteModal] = useBoolState(false);

  const mutationScope = {
    spaceId: link.space?.id,
    resourceHubId: link.resourceHubId,
    parentFolderId: link.parentFolderId,
  };
  const { mutateAsync: remove } = useDeleteLink(mutationScope);
  const options = useLinkPageOptions({ showDeleteModal: toggleDeleteModal });

  assertPresent(link.notifications, "notifications must be present in link");
  assertPresent(link.name, "name must be present in link");
  assertPresent(link.url, "url must be present in link");
  assertPresent(link.author, "author must be present in link");
  assertPresent(link.insertedAt, "insertedAt must be present in link");
  assertPresent(link.description, "description must be present in link");
  assertPresent(link.permissions?.canCommentOnLink, "permissions must be present in link");
  assertPresent(link.reactions, "reactions must be present in link");
  assertPresent(link.potentialSubscribers, "potentialSubscribers must be present in link");
  assertPresent(link.subscriptionList, "subscriptionList must be present in link");

  const entity = { id: link.id, type: "resource_hub_link" as const };
  const invalidateQueries = (client: QueryClient, refetchType: "active" | "none") =>
    invalidateResourceHubInteractionQueries(client, { ...entity, ...mutationScope }, refetchType);

  const reactionsForm = useOptimisticReactions({
    entity,
    initialReactions: link.reactions ?? undefined,
    onRefresh: refresh,
  });
  const comments = useCommentSection({
    entity,
    mentionSearchScope: { type: "resource_hub", id: link.resourceHubId },
    invalidateQueries,
    canComment: link.permissions.canCommentOnLink,
  });
  useReadNotificationsOnLoad(link.notifications, (client) => invalidateQueries(client, "none"));

  const subscriptionsState = useCurrentSubscriptionsQueryAdapter({
    potentialSubscribers: link.potentialSubscribers,
    subscriptionList: link.subscriptionList,
    resourceName: "link",
    type: "resource_hub_link",
    onRefresh: refresh,
  });

  async function handleDelete() {
    await remove({ linkId: link.id });

    if (link.parentFolder) {
      navigate(paths.resourceHubFolderPath(link.parentFolder.id!));
    } else {
      navigate(resourceHubLandingPath(paths, link));
    }
  }

  if (!comments) return null;

  return (
    <LinkPage
      pageTitle={link.name}
      navigation={buildLinkPageNavigation(link, paths)}
      options={options}
      testId="resource-hub-link-page"
      linkType={link.type! as ResourceHubLinkType}
      title={link.name}
      url={link.url}
      author={link.author}
      postedAt={link.insertedAt}
      formattedTimePreferences={formattedTimePreferences}
      description={link.description}
      mentionedPersonLookup={mentionedPersonLookup}
      resolveResourceLinkTitles={resolveResourceLinkTitles}
      reactions={{
        ...reactionsForm,
        size: 24,
        canAddReaction: link.permissions.canCommentOnLink,
      }}
      comments={comments}
      subscriptions={{
        ...subscriptionsState,
        isCurrentUserSubscribed,
        canEditSubscribers: link.permissions?.canEditLink || false,
      }}
      deleteModal={{
        isOpen: showDeleteModal,
        onClose: toggleDeleteModal,
        linkName: link.name,
        onConfirm: handleDelete,
      }}
    />
  );
}
