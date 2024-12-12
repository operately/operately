import React, { useEffect, useState } from "react";

import { findFileSize, resizeImage, uploadFile } from "@/models/blobs";
import { ResourceHub, ResourceHubFile, ResourceHubFolder, useCreateResourceHubFile } from "@/models/resourceHubs";

import Forms from "@/components/Forms";
import Modal from "@/components/Modal";
import { Options, SubscribersSelector, useSubscriptions } from "@/features/Subscriptions";
import { assertPresent } from "@/utils/assertions";
import { Spacer } from "@/components/Spacer";
import { LoadingProgressBar } from "@/components/LoadingProgressBar";
import { useNewFileModalsContext } from "./contexts/NewFileModalsContext";

interface FormProps {
  resourceHub: ResourceHub;
  folder?: ResourceHubFolder;
  refresh: () => void;
}

export function AddFileModal({ resourceHub, folder, refresh }: FormProps) {
  const potentialSubscribers = folder?.potentialSubscribers || resourceHub.potentialSubscribers;
  const { file, hideAddFilePopUp, showAddFilePopUp } = useNewFileModalsContext();

  assertPresent(potentialSubscribers, "potentialSubscribers must be present in folder or resourceHub");

  const [progress, setProgress] = useState(0);
  const [post] = useCreateResourceHubFile();
  const subscriptionsState = useSubscriptions(potentialSubscribers, {
    ignoreMe: true,
  });

  useEffect(() => {
    if (form && file) {
      form.actions.setValue("name", file.name);
      setProgress(0);
    }
  }, [file]);

  const form = Forms.useForm({
    fields: {
      name: "",
      description: null,
    },
    validate: (addError) => {
      if (!form.values.name) {
        addError("name", "Name is required");
      }
    },
    cancel: showAddFilePopUp,
    submit: async () => {
      const previewBlobId = await maybeUploadPreviewBlob(file, setProgress);
      const blobId = await uploadMainBlob(file, setProgress);

      await post({
        name: form.values.name,
        description: JSON.stringify(form.values.description),
        blobId,
        previewBlobId,
        resourceHubId: resourceHub.id,
        folderId: folder?.id,
        sendNotificationsToEveryone: subscriptionsState.subscriptionType == Options.ALL,
        subscriberIds: subscriptionsState.currentSubscribersList,
      });

      // Reset and clean up
      refresh();
      hideAddFilePopUp();
      form.actions.reset();
    },
  });

  if (form.state === "submitting") return <UploadingModal progress={progress} isOpen={Boolean(file)} />;

  return (
    <Modal title="Upload file" isOpen={Boolean(file)} hideModal={hideAddFilePopUp}>
      <Forms.Form form={form}>
        <div className="max-h-[65vh] overflow-y-scroll">
          <Forms.FieldGroup>
            <Forms.TextInput label="Name" field="name" />
            <Forms.RichTextArea
              label="Description"
              field="description"
              mentionSearchScope={{ type: "none" }}
              placeholder="Description..."
              height="min-h-[120px]"
            />
            <FileDetails file={file} />
          </Forms.FieldGroup>

          <Spacer size={2} />
          <SubscribersSelector state={subscriptionsState} resourceHubName={resourceHub.name!} />
        </div>

        <Forms.Submit cancelText="Change file" />
      </Forms.Form>
    </Modal>
  );
}

function FileDetails({ file }: { file?: ResourceHubFile }) {
  return (
    <div className="flex gap-4 items-center">
      <div>
        <b>File:</b> {file?.name}
      </div>
      <div>&middot;</div>
      <div>
        <b>Size:</b> {file && findFileSize(file.size!)}
      </div>
    </div>
  );
}

function UploadingModal({ progress, isOpen }) {
  return (
    <Modal isOpen={isOpen}>
      <div className="text-center">Uploading file</div>
      <LoadingProgressBar progress={progress} barClassName="mt-2" />
    </Modal>
  );
}

async function uploadMainBlob(file: File, setProgress: React.Dispatch<React.SetStateAction<number>>) {
  const blob = await uploadFile(file, (progress) => {
    // If the file is an image, a preview blob is uploaded
    // before the main blob, which accounts for the first 20%
    // of the progress bar.
    if (file.type.includes("image")) {
      setProgress(20 + progress * 0.8);
    } else {
      setProgress(progress);
    }
  });
  return blob.id;
}

async function maybeUploadPreviewBlob(file: File, setProgress: React.Dispatch<React.SetStateAction<number>>) {
  if (file.type.includes("image")) {
    const compressedImage = await resizeImage(file, { width: 100 });
    const previewBlob = await uploadFile(compressedImage, (progress) => setProgress(progress * 0.2));
    return previewBlob.id;
  }

  return;
}
