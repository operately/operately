import React from "react";
import { useNavigate } from "react-router";

import { documents, resourceHubLandingPath } from "@/models/resourceHubs";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { useSubscriptionsAdapter } from "@/models/subscriptions";
import { usePaths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { NewDocumentPage, showErrorToast } from "turboui";

import { useLoadedData } from "./loader";
import { buildNewDocumentPageNavigation } from "./navigation";

export function Page() {
  const { resourceHub, folder } = useLoadedData();
  const paths = usePaths();
  const navigate = useNavigate();
  const [post] = documents.useCreate();

  assertPresent(resourceHub.potentialSubscribers, "potentialSubscribers must be present in resourceHub");

  const subscriptionsState = useSubscriptionsAdapter(resourceHub.potentialSubscribers, {
    ignoreMe: true,
    resourceHubName: resourceHub.name,
  });

  const richTextHandlers = useRichEditorHandlers({ scope: { type: "resource_hub", id: resourceHub.id! } });
  const cancelLink = folder ? paths.resourceHubFolderPath(folder.id!) : resourceHubLandingPath(paths, resourceHub);

  async function handleSubmit(values: NewDocumentPage.Values, meta: { isDraft: boolean }) {
    try {
      const res = await post({
        resourceHubId: resourceHub.id,
        folderId: folder?.id,
        name: values.title,
        content: JSON.stringify(values.content),
        sendNotificationsToEveryone: subscriptionsState.notifyEveryone,
        subscriberIds: subscriptionsState.currentSubscribersList,
        postAsDraft: meta.isDraft,
      });
      navigate(paths.resourceHubDocumentPath(res.document!.id!));
      return true;
    } catch {
      showErrorToast("Document not created", "Check the form and try again.");
      return false;
    }
  }

  return (
    <NewDocumentPage
      pageTitle="New Document"
      navigation={buildNewDocumentPageNavigation(resourceHub, folder, paths)}
      testId="resource-hub-new-document-page"
      richTextHandlers={richTextHandlers}
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
