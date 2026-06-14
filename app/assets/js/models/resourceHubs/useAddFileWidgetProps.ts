import { useMemo } from "react";

import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { findFileSize, resizeImage, uploadFile } from "@/models/blobs";
import { files, type ResourceHub, type ResourceHubFolder } from "@/models/resourceHubs";
import { SubscriptionsState, useSubscriptionsAdapter } from "@/models/subscriptions";
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

        const uploader = new FileUploader({
          items,
          resourceHubId: resourceHub.id,
          folderId: folder?.id,
          subscriptions: subscriptionsState,
          setProgress,
        });

        await uploader.upload();
        onUploaded();
      },
    }),
    [resourceHub?.id, resourceHub?.name, folder?.id, subscriptionsState, richTextHandlers, onUploaded],
  );
}

interface FileForUpload {
  file: File;
  blobId?: string;
  progress: number;
}

interface FileUploaderAttrs {
  items: AddFileUploadItem[];
  resourceHubId: string;
  folderId?: string;
  subscriptions: SubscriptionsState;
  setProgress: (progress: number) => void;
}

class FileUploader {
  private items: UploadItem[];
  private resourceHubId: string;
  private folderId?: string;
  private subscriptions: SubscriptionsState;
  private totalSize: number = 0;
  private totalProgress: number = 0;
  private setProgress: (progress: number) => void;

  constructor(attrs: FileUploaderAttrs) {
    this.items = attrs.items.map((item) => new UploadItem(item));
    this.resourceHubId = attrs.resourceHubId;
    this.folderId = attrs.folderId;
    this.subscriptions = attrs.subscriptions;
    this.setProgress = attrs.setProgress;
  }

  async upload() {
    await this.generatePreviewBlob();
    this.calculateTotalSize();
    await this.uploadBlobs();
    await this.uploadFiles();
  }

  private async uploadFiles() {
    await files.create({
      files: this.items.map((item) => ({
        name: item.source.nameWithExtension,
        description: JSON.stringify(item.source.description),
        blobId: item.mainFile.blobId,
        previewBlobId: item.previewFile?.blobId,
      })),
      resourceHubId: this.resourceHubId,
      folderId: this.folderId,
      sendNotificationsToEveryone: this.subscriptions.notifyEveryone,
      subscriberIds: this.subscriptions.currentSubscribersList,
    });
  }

  private async uploadBlobs() {
    await Promise.all(
      this.items.map(async (item) => {
        const [blobId, previewBlobId] = await this.uploadBlobAndBlobPreview(item);

        if (item.previewFile) {
          item.previewFile.blobId = previewBlobId!;
        }
        item.mainFile.blobId = blobId!;
      }),
    );
  }

  private async uploadBlobAndBlobPreview(item: UploadItem) {
    return await Promise.all([this.uploadSingleBlob(item.mainFile), this.uploadSingleBlob(item.previewFile)]);
  }

  private async uploadSingleBlob(file: FileForUpload | undefined) {
    if (!file) return;

    const blob = await uploadFile(file.file, (progress) => {
      const ratio = file.file.size / this.totalSize;
      const result = this.totalProgress + (progress - file.progress) * ratio;

      file.progress = progress;
      this.totalProgress = result;

      this.setProgress(result);
    });
    return blob.id;
  }

  private async generatePreviewBlob() {
    await Promise.all(
      this.items.map(async (item) => {
        if (item.source.mainFile.type.includes("image")) {
          const file = await resizeImage(item.source.mainFile, { width: 100 });
          item.previewFile = { file, blobId: undefined, progress: 0 };
        }
      }),
    );
  }

  private calculateTotalSize() {
    let total = 0;

    this.items.forEach((item) => {
      total += item.mainFile.file.size;
      if (item.previewFile) {
        total += item.previewFile.file.size;
      }
    });

    this.totalSize = total;
  }
}

class UploadItem {
  source: AddFileUploadItem;
  mainFile: FileForUpload;
  previewFile?: FileForUpload;

  constructor(source: AddFileUploadItem) {
    this.source = source;
    this.mainFile = {
      file: source.mainFile,
      blobId: undefined,
      progress: 0,
    };
  }
}
