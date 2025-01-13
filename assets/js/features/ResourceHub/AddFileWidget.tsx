import React, { useEffect, useState } from "react";

import { IconX } from "@tabler/icons-react";
import { findFileSize, resizeImage, uploadFile } from "@/models/blobs";
import { ResourceHub, ResourceHubFile, ResourceHubFolder, createResourceHubFile } from "@/models/resourceHubs";

import Forms from "@/components/Forms";
import Modal from "@/components/Modal";
import { Options, SubscribersSelector, useSubscriptions, SubscriptionsState } from "@/features/Subscriptions";
import { assertPresent } from "@/utils/assertions";
import { Spacer } from "@/components/Spacer";
import { LoadingProgressBar } from "@/components/LoadingProgressBar";
import { emptyContent } from "@/components/RichContent";

import { useNewFileModalsContext } from "./contexts/NewFileModalsContext";
import { FileIcon } from "./NodeIcon";

interface FormProps {
  resourceHub: ResourceHub;
  folder?: ResourceHubFolder;
  refresh: () => void;
}

export function AddFileWidget({ resourceHub, folder, refresh }: FormProps) {
  const potentialSubscribers = folder?.potentialSubscribers || resourceHub.potentialSubscribers;
  const { files, setFiles, filesSelected } = useNewFileModalsContext();

  assertPresent(potentialSubscribers, "potentialSubscribers must be present in folder or resourceHub");

  const [progress, setProgress] = useState(0);
  const subscriptionsState = useSubscriptions(potentialSubscribers, {
    ignoreMe: true,
  });

  const form = Forms.useForm({
    fields: {
      items: [],
    },
    validate: (addError) => {
      form.values.items.forEach((item: PayloadItem, idx: number) => {
        if (!item.name) {
          addError(`items[${idx}].name`, "Name is required");
        }
      });
    },
    cancel: () => setFiles(undefined),
    submit: async () => {
      const uploader = new FileUploader({
        items: form.values.items,
        resourceHubId: resourceHub.id!,
        folderId: folder?.id!,
        subscriptions: subscriptionsState,
        setProgress: setProgress,
      });

      await uploader.upload();

      setFiles(undefined);
      refresh();
    },
  });

  useEffect(() => {
    if (form && files) {
      const initialFileItems = parseNewFileItems(files);
      form.actions.setValue("items", initialFileItems);
      setProgress(0);
    }
  }, [files]);

  if (form.state === "submitting") return <UploadingModal progress={progress} isOpen={filesSelected} />;

  if (!filesSelected) return <></>;

  return (
    <div className="border border-surface-outline shadow-lg p-8 rounded-lg">
      <Forms.Form form={form}>
        <Files field="items" />

        <Spacer size={2} />
        <SubscribersSelector state={subscriptionsState} resourceHubName={resourceHub.name!} />

        <Forms.Submit cancelText="Cancel" />
      </Forms.Form>
    </div>
  );
}

function Files({ field }) {
  const [files] = Forms.useFieldValue<File[]>(field);

  return (
    <div>
      <div>
        {files.map((_, i) => (
          <FileForm key={i} index={i} />
        ))}
      </div>
    </div>
  );
}

function FileForm({ index }) {
  const [item] = Forms.useFieldValue<PayloadItem>(`items[${index}]`);
  const { setFiles } = useNewFileModalsContext();

  const removeFile = () => {
    setFiles((files) => {
      files?.splice(index, 1);
      return files ? [...files] : undefined;
    });
  };

  return (
    <div className="border border-stroke-base p-4 rounded-lg mb-4 flex items-start gap-4 relative">
      <FileIcon size={60} filetype={parseFileType(item.mainFile.file.type)} />

      <div className="flex-1">
        <Forms.FieldGroup layout="vertical">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Forms.TextInput field={`items[${index}].name`} />
            </div>
          </div>

          <Forms.RichTextArea
            field={`items[${index}].description`}
            placeholder="Leave notes here..."
            mentionSearchScope={{ type: "resource_hub", id: "123" }}
            height="min-h-[80px]"
          />
          <FileDetails file={item.mainFile.file} />
        </Forms.FieldGroup>
      </div>

      <div className="absolute -top-3 -right-3 rounded-full bg-red-500 text-white-1 p-1" onClick={removeFile}>
        <IconX className="cursor-pointer" size={20} />
      </div>
    </div>
  );
}

function FileDetails({ file }: { file: ResourceHubFile }) {
  return (
    <div className="flex gap-4 items-center text-sm">
      <div>
        <b>File:</b> {file.name}
      </div>
      <div>&middot;</div>
      <div>
        <b>Size:</b> {findFileSize(file.size!)}
      </div>
    </div>
  );
}

function UploadingModal({ progress, isOpen }) {
  const { files } = useNewFileModalsContext();
  const text = files?.length === 1 ? "Uploading file" : "Uploading files";

  return (
    <Modal isOpen={isOpen}>
      <div className="text-center">{text}</div>
      <LoadingProgressBar progress={progress} barClassName="mt-2" />
    </Modal>
  );
}

function parseNewFileItems(files: File[]): PayloadItem[] {
  return files.map((file) => ({
    mainFile: {
      file: file,
      blobId: undefined,
      progress: 0,
    },
    name: file.name,
    description: emptyContent(),
  }));
}

function parseFileType(fileType: string) {
  const pieces = fileType.split("/");

  if (pieces.length == 2) {
    return pieces[pieces.length - 1];
  }

  return fileType;
}

interface FileForUpload {
  file: File;
  blobId?: string;
  progress: number;
}

interface PayloadItem {
  mainFile: FileForUpload;
  previewFile?: FileForUpload;
  name: string;
  description: any;
}

interface FileUploaderAttrs {
  items: PayloadItem[];
  resourceHubId: string;
  folderId?: string;
  subscriptions: SubscriptionsState;
  setProgress: (progress: number) => void;
}

class FileUploader {
  private items: PayloadItem[];
  private resourceHubId: string;
  private folderId?: string;
  private subscriptions: SubscriptionsState;
  private totalSize: number;
  private totalProgress: number = 0;
  private setProgress: (progress: number) => void;

  constructor(attrs: FileUploaderAttrs) {
    this.items = attrs.items;
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
    await createResourceHubFile({
      files: this.items.map((item) => ({
        name: item.name,
        description: JSON.stringify(item.description),
        blobId: item.mainFile.blobId,
        previewBlobId: item.previewFile?.blobId,
      })),
      resourceHubId: this.resourceHubId,
      folderId: this.folderId,
      sendNotificationsToEveryone: this.subscriptions.subscriptionType == Options.ALL,
      subscriberIds: this.subscriptions.currentSubscribersList,
    });
  }

  private async uploadBlobs() {
    this.items = await Promise.all(
      this.items.map(async (item) => {
        const [blobId, previewBlobId] = await this.uploadBlobAndBlobPreview(item);

        if (item.previewFile) {
          item.previewFile.blobId = previewBlobId!;
        }
        item.mainFile.blobId = blobId!;

        return item;
      }),
    );
  }

  private async uploadBlobAndBlobPreview(item: PayloadItem) {
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
    this.items = await Promise.all(
      this.items.map(async (item) => {
        if (item.mainFile.file.type.includes("image")) {
          const file = await resizeImage(item.mainFile.file, { width: 100 });
          const previewFile: FileForUpload = { file: file, blobId: undefined, progress: 0 };

          return { ...item, previewFile };
        } else {
          return item;
        }
      }),
    );
  }

  private async calculateTotalSize() {
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
