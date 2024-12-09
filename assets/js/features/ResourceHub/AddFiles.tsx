import React, { useState } from "react";

import { findFileSize, resizeImage, uploadFile } from "@/models/blobs";
import { ResourceHub, ResourceHubFolder, useCreateResourceHubFile } from "@/models/resourceHubs";

import Forms from "@/components/Forms";
import Modal from "@/components/Modal";
import { Options, SubscribersSelector, useSubscriptions } from "@/features/Subscriptions";
import { assertPresent } from "@/utils/assertions";
import { Spacer } from "@/components/Spacer";

interface UseFormProps {
  file: any;
  hideAddFilePopUp: () => void;
  showAddFilePopUp: () => void;
}

interface FormProps extends UseFormProps {
  resourceHub: ResourceHub;
  folder?: ResourceHubFolder;
  refresh: () => void;
}

export function AddFileModal({ file, resourceHub, folder, hideAddFilePopUp, showAddFilePopUp, refresh }: FormProps) {
  const potentialSubscribers = folder?.potentialSubscribers || resourceHub.potentialSubscribers;

  assertPresent(potentialSubscribers, "potentialSubscribers must be present in folder or resourceHub");

  const [post] = useCreateResourceHubFile();
  const subscriptionsState = useSubscriptions(potentialSubscribers, {
    ignoreMe: true,
  });

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
      const blob = await uploadFile(file, () => {});
      const previewBlobId = await maybeUploadPreviewBlob(file);

      await post({
        name: form.values.name,
        description: JSON.stringify(form.values.description),
        blobId: blob.id,
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

  return (
    <Modal title="Upload file" isOpen={Boolean(file)} hideModal={hideAddFilePopUp}>
      <Forms.Form form={form}>
        <div className="max-h-[70vh] overflow-y-scroll">
          <Forms.FieldGroup>
            <Forms.TextInput label="Name" field="name" />
            <Forms.RichTextArea
              label="Description"
              field="description"
              mentionSearchScope={{ type: "none" }}
              placeholder="Description..."
            />
            <div>
              <div>File: {file?.name}</div>
              <div>Size: {findFileSize(file?.size)}</div>
            </div>
          </Forms.FieldGroup>

          <Spacer size={4} />
          <SubscribersSelector state={subscriptionsState} resourceHubName={resourceHub.name!} />
        </div>

        <Forms.Submit cancelText="Change file" />
      </Forms.Form>
    </Modal>
  );
}

export function useAddFile(): UseFormProps {
  const [file, setFile] = useState();

  const showAddFilePopUp = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";

    fileInput.onchange = (e: any) => {
      const file = e.target?.files[0];
      setFile(file);
    };

    fileInput.click();
  };

  const hideAddFilePopUp = () => setFile(undefined);

  return { file, showAddFilePopUp, hideAddFilePopUp };
}

async function maybeUploadPreviewBlob(file: File) {
  if (file.type.includes("image")) {
    const compressedImage = await resizeImage(file, { width: 100 });
    const previewBlob = await uploadFile(compressedImage as any, () => {});
    return previewBlob.id;
  }

  return;
}
