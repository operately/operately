import React from "react";
import { useNavigate } from "react-router";

import { links, resourceHubLandingPath } from "@/models/resourceHubs";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { useSubscriptionsAdapter } from "@/models/subscriptions";
import { usePaths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { LinkNewPage, showErrorToast } from "turboui";
import type { LinkNewPage as LinkNewPageTypes } from "turboui/LinkNewPage/types";

import { useLoadedData } from "./loader";
import { buildNewLinkPageNavigation } from "./navigation";

export function Page() {
  const { resourceHub, folder, linkType } = useLoadedData();
  const paths = usePaths();
  const navigate = useNavigate();
  const [post] = links.useCreate();

  assertPresent(resourceHub.potentialSubscribers, "potentialSubscribers must be present in resourceHub");

  const subscriptionsState = useSubscriptionsAdapter(resourceHub.potentialSubscribers, {
    ignoreMe: true,
    resourceHubName: resourceHub.name,
  });

  const richTextHandlers = useRichEditorHandlers({ scope: { type: "resource_hub", id: resourceHub.id! } });
  const cancelLink = folder ? paths.resourceHubFolderPath(folder.id!) : resourceHubLandingPath(paths, resourceHub);

  async function handleSubmit(values: LinkNewPageTypes.Values) {
    try {
      const res = await post({
        resourceHubId: resourceHub.id,
        folderId: folder?.id,
        name: values.title,
        url: values.link,
        type: values.type || "other",
        description: JSON.stringify(values.description),
        sendNotificationsToEveryone: subscriptionsState.notifyEveryone,
        subscriberIds: subscriptionsState.currentSubscribersList,
      });
      navigate(paths.resourceHubLinkPath(res.link.id));
      return true;
    } catch {
      showErrorToast("Link not created", "Check the form and try again.");
      return false;
    }
  }

  return (
    <LinkNewPage
      pageTitle="New Link"
      navigation={buildNewLinkPageNavigation(resourceHub, folder, paths)}
      testId="resource-hub-new-link-page"
      richTextHandlers={richTextHandlers}
      initialType={linkType}
      cancelLink={cancelLink}
      subscriptions={{
        subscribers: subscriptionsState.subscribers,
        selectedSubscribers: subscriptionsState.selectedSubscribers,
        onSelectedSubscribersChange: subscriptionsState.onSelectedSubscribersChange,
        subscriptionType: subscriptionsState.subscriptionType,
        onSubscriptionTypeChange: subscriptionsState.onSubscriptionTypeChange,
        alwaysNotify: subscriptionsState.alwaysNotify,
        allSubscribersLabel: subscriptionsState.allSubscribersLabel,
      }}
      onSubmit={handleSubmit}
    />
  );
}
