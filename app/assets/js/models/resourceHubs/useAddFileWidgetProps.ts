import { useMemo } from "react";

import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { findFileSize, uploadFilesWithPreviews } from "@/models/blobs";
import { files, type ResourceHub, type ResourceHubFolder } from "@/models/resourceHubs";
import { useSubscriptionsAdapter } from "@/models/subscriptions";
import type { AddFileUploadItem, AddFileWidgetProps } from "turboui";

interface UseAddFileWidgetPropsArgs {
  resourceHub?: ResourceHub | null;
  folder?: ResourceHubFolder | null;
  onUploaded: () => void;
}

export function useAddFileWidgetProps({
  resourceHub,
  folder,
  onUploaded,
}: UseAddFileWidgetPropsArgs): Pick<
  AddFileWidgetProps,
  "subscriptions" | "richTextHandlers" | "formatFileSize" | "onUpload"
> {
  const potentialSubscribers = folder?.potentialSubscribers || resourceHub?.potentialSubscribers || [];

  const subscriptionsState = useSubscriptionsAdapter(potentialSubscribers, {
    ignoreMe: true,
    resourceHubName: resourceHub?.name ?? "",
  });
  const richTextHandlers = useRichEditorHandlers({
    scope: { type: "resource_hub", id: resourceHub?.id ?? "" },
  });

  return useMemo(
    () => ({
      subscriptions: subscriptionsState,
      richTextHandlers,
      formatFileSize: findFileSize,
      onUpload: async (items: AddFileUploadItem[], setProgress: (progress: number) => void) => {
        if (!resourceHub?.id) return;

        await uploadFilesWithPreviews({
          items,
          setProgress,
          persist: (uploaded) =>
            files.create({
              files: uploaded.map((file) => ({
                name: file.name,
                description: JSON.stringify(file.description),
                blobId: file.blobId,
                previewBlobId: file.previewBlobId,
              })),
              resourceHubId: resourceHub.id,
              folderId: folder?.id,
              sendNotificationsToEveryone: subscriptionsState.notifyEveryone,
              subscriberIds: subscriptionsState.currentSubscribersList,
            }),
        });
        onUploaded();
      },
    }),
    [resourceHub?.id, resourceHub?.name, folder?.id, subscriptionsState, richTextHandlers, onUploaded],
  );
}
