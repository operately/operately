import { useMemo } from "react";

import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { findFileSize } from "@/models/blobs";
import { files, type ResourceHub, type ResourceHubFolder } from "@/models/resourceHubs";
import { useSubscriptionsAdapter } from "@/models/subscriptions";
import type { AddFileUploadItem, AddFileWidgetProps } from "turboui";
import { uploadFiles } from "./uploadFiles";

interface UseAddFileWidgetPropsArgs {
  resourceHub?: ResourceHub | null;
  folder?: ResourceHubFolder | null;
  onUploaded: () => void;
}

type AddFileWidgetBridgeProps = Pick<AddFileWidgetProps, "richTextHandlers" | "formatFileSize" | "onUpload"> & {
  subscriptions: NonNullable<AddFileWidgetProps["subscriptions"]>;
};

export function useAddFileWidgetProps({
  resourceHub,
  folder,
  onUploaded,
}: UseAddFileWidgetPropsArgs): AddFileWidgetBridgeProps {
  const potentialSubscribers = folder?.potentialSubscribers || resourceHub?.potentialSubscribers || [];

  const subscriptionsState = useSubscriptionsAdapter(potentialSubscribers, {
    ignoreMe: true,
    resourceHubName: resourceHub?.name ?? "",
  });
  const richTextHandlers = useRichEditorHandlers({
    scope: { type: "resource_hub", id: resourceHub?.id ?? "" },
  });

  return useMemo((): AddFileWidgetBridgeProps => {
    const {
      currentSubscribersList,
      notifyEveryone,
      // TurboUI SubscribersSelector props — omit adapter-only fields.
      ...subscriptions
    } = subscriptionsState;

    return {
      subscriptions,
      richTextHandlers,
      formatFileSize: findFileSize,
      onUpload: async (items: AddFileUploadItem[], setProgress: (progress: number) => void) => {
        if (!resourceHub?.id) return;

        await uploadFiles({
          items,
          setProgress,
          persist: (uploadedFiles) =>
            files.create({
              files: uploadedFiles.map((file) => ({ ...file, description: JSON.stringify(file.description) })),
              resourceHubId: resourceHub.id,
              folderId: folder?.id,
              sendNotificationsToEveryone: notifyEveryone,
              subscriberIds: currentSubscribersList,
            }),
        });
        onUploaded();
      },
    };
  }, [resourceHub?.id, resourceHub?.name, folder?.id, subscriptionsState, richTextHandlers, onUploaded]);
}
