import React from "react";
import { useNavigate } from "react-router";

import { documents } from "@/models/resourceHubs";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { useSubscriptionsAdapter } from "@/models/subscriptions";
import { usePaths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { DocumentEditPage, showErrorToast, SubscribersSelector } from "turboui";
import type { DocumentEditPage as DocumentEditPageTypes } from "turboui/DocumentEditPage/types";

import { useLoadedData } from "./loader";
import { buildEditDocumentPageNavigation } from "./navigation";

export function Page() {
  const { document } = useLoadedData();
  const paths = usePaths();
  const navigate = useNavigate();
  const [edit] = documents.useUpdate();
  const [publish] = documents.usePublish();

  const isDraft = document.state === "draft";

  assertPresent(document.potentialSubscribers, "potentialSubscribers must be present in document");
  assertPresent(document.subscriptionList, "subscriptionList must be present in document");
  assertPresent(document.resourceHub, "resourceHub must be present in document");
  assertPresent(document.name, "name must be present in document");
  assertPresent(document.content, "content must be present in document");
  assertPresent(document.resourceHubId, "resourceHubId must be present in document");

  const subscriptionsState = useSubscriptionsAdapter(document.potentialSubscribers ?? [], {
    ignoreMe: true,
    sendNotificationsToEveryone: document.subscriptionList?.sendToEveryone ?? undefined,
    resourceHubName: document.resourceHub.name,
  });

  const initialSubscriptionsRef = React.useRef<{
    subscriptionType: SubscribersSelector.SubscriptionOption;
    subscriberIds: string[];
  } | null>(null);

  if (initialSubscriptionsRef.current === null) {
    initialSubscriptionsRef.current = {
      subscriptionType: subscriptionsState.subscriptionType,
      subscriberIds: [...subscriptionsState.currentSubscribersList],
    };
  }

  const richTextHandlers = useRichEditorHandlers({ scope: { type: "resource_hub", id: document.resourceHubId } });
  const cancelLink = paths.resourceHubDocumentPath(document.id!);
  const initialContent = JSON.parse(document.content);

  async function handleSubmit(
    values: DocumentEditPageTypes.Values,
    meta: { action: "save" | "publish-draft"; contentChanged: boolean },
  ) {
    try {
      const serializedContent = JSON.stringify(values.content);
      const subscriptionPayload = {
        sendNotificationsToEveryone: subscriptionsState.notifyEveryone,
        subscriberIds: subscriptionsState.currentSubscribersList,
      };
      const subscriptionsChanged = hasSubscriptionsChanged(
        isDraft,
        initialSubscriptionsRef.current,
        subscriptionsState,
      );

      if (meta.action === "save") {
        if (meta.contentChanged || subscriptionsChanged) {
          await edit({
            documentId: document.id,
            name: values.title,
            content: serializedContent,
            ...(isDraft ? subscriptionPayload : {}),
          });
        }
      } else {
        await publish({
          documentId: document.id,
          name: values.title,
          content: serializedContent,
          ...(isDraft ? subscriptionPayload : {}),
        });
      }

      navigate(cancelLink);
      return true;
    } catch {
      showErrorToast("Document not updated", "Check the form and try again.");
      return false;
    }
  }

  const shared = {
    pageTitle: "Edit Document" as const,
    navigation: buildEditDocumentPageNavigation(document, paths),
    testId: "resource-hub-edit-document-page",
    richTextHandlers,
    initialTitle: document.name,
    initialContent,
    cancelLink,
    onSubmit: handleSubmit,
  };

  if (isDraft) {
    return (
      <DocumentEditPage
        {...shared}
        subscriptions={{
          subscribers: subscriptionsState.subscribers,
          selectedSubscribers: subscriptionsState.selectedSubscribers,
          onSelectedSubscribersChange: subscriptionsState.onSelectedSubscribersChange,
          subscriptionType: subscriptionsState.subscriptionType,
          onSubscriptionTypeChange: subscriptionsState.onSubscriptionTypeChange,
          alwaysNotify: subscriptionsState.alwaysNotify,
          allSubscribersLabel: subscriptionsState.allSubscribersLabel,
        }}
      />
    );
  }

  return <DocumentEditPage {...shared} hideSubscriptions hidePublishAction />;
}

function hasSubscriptionsChanged(
  isDraft: boolean,
  initialSubscriptions: { subscriptionType: SubscribersSelector.SubscriptionOption; subscriberIds: string[] } | null,
  currentState: { subscriptionType: SubscribersSelector.SubscriptionOption; currentSubscribersList: string[] },
) {
  if (!isDraft) return false;
  if (!initialSubscriptions) return false;

  const typeChanged = initialSubscriptions.subscriptionType !== currentState.subscriptionType;
  const subscribersChanged = !areIdListsEqual(initialSubscriptions.subscriberIds, currentState.currentSubscribersList);

  return typeChanged || subscribersChanged;
}

function areIdListsEqual(initialIds: string[] | null, currentIds: string[]) {
  if (!initialIds) return currentIds.length === 0;
  if (initialIds.length !== currentIds.length) return false;

  const sortedInitial = [...initialIds].sort();
  const sortedCurrent = [...currentIds].sort();

  return sortedInitial.every((id, index) => id === sortedCurrent[index]);
}
