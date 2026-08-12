import React from "react";
import { useNavigate } from "react-router";

import * as Pages from "@/components/Pages";
import * as ReactionsModel from "@/models/reactions";
import { links, resourceHubLandingPath } from "@/models/resourceHubs";
import { usePaths } from "@/routes/paths";

import { useComments, useCommentSectionProps } from "@/features/CommentSection";
import { useClearNotificationsOnLoad } from "@/features/notifications";
import { useCurrentSubscriptionsAdapter } from "@/models/subscriptions";
import { useBoolState } from "@/hooks/useBoolState";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { assertPresent } from "@/utils/assertions";
import { LinkPage, type ResourceHubLinkType } from "turboui";

import { useLinkPageOptions } from "./Options";
import { useLoadedData } from "./loader";
import { buildLinkPageNavigation } from "./navigation";

export function Page() {
  const { link, isCurrentUserSubscribed } = useLoadedData();
  const paths = usePaths();
  const navigate = useNavigate();
  const refresh = Pages.useRefresh();
  const formattedTimePreferences = useFormattedTimePreferences();
  const { mentionedPersonLookup } = useRichEditorHandlers();
  const [showDeleteModal, toggleDeleteModal] = useBoolState(false);
  const [remove] = links.useDelete();
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
  useClearNotificationsOnLoad(link.notifications);

  const reactions = link.reactions.map((r) => r!);
  const entity = ReactionsModel.entity(link.id!, "resource_hub_link");
  const reactionsForm = ReactionsModel.useReactionsForm(entity, reactions);
  const commentsForm = useComments({ parentType: "resource_hub_link", link });
  const comments = useCommentSectionProps({
    form: commentsForm,
    commentParentType: "resource_hub_link",
    canComment: link.permissions.canCommentOnLink,
  });
  const subscriptionsState = useCurrentSubscriptionsAdapter({
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
