import * as React from "react";
import * as Hub from "@/models/resourceHubs";

import Modal from "@/components/Modal";
import Forms from "@/components/Forms";
import { MenuActionItem } from "@/components/Menu";
import { createTestId } from "@/utils/testid";
import { useNodesContext } from "@/features/ResourceHub";
import { FolderSelectField } from "@/features/ResourceHub/FolderSelectField";
import { useSubscriptions } from "@/features/Subscriptions";
import { assertPresent } from "@/utils/assertions";
import { Paths } from "@/routes/paths";
import { useNavigate } from "react-router-dom";

interface Props {
  resource: Hub.Resource;
  showModal: () => void;
}

export function CopyResourceMenuItem({ resource, showModal }: Props) {
  const testId = createTestId("copy-resource", resource.id!);

  return (
    <MenuActionItem onClick={showModal} testId={testId}>
      Copy
    </MenuActionItem>
  );
}

interface FormProps {
  resource: Hub.ResourceHubDocument;
  isOpen: boolean;
  hideModal: () => void;
}

export function CopyResourceModal({ resource, isOpen, hideModal }: FormProps) {
  const { parent } = useNodesContext();
  const [post] = Hub.useCreateResourceHubDocument();
  const navigate = useNavigate();

  assertPresent(parent?.potentialSubscribers, "potentialSubscribers must be present in resourceHub or folder");
  assertPresent(resource.resourceHubId, "resourceHubId must be present in resource");

  const subscriptionsState = useSubscriptions(parent.potentialSubscribers, { ignoreMe: true });

  const form = Forms.useForm({
    fields: {
      name: resource.name + " - Copy",
      location: {
        id: parent?.id,
        type: "pathToFolder" in parent ? "folder" : "resourceHub",
      },
    },
    cancel: hideModal,
    submit: async () => {
      const res = await post({
        resourceHubId: resource.resourceHubId,
        folderId: form.values.location.type == "folder" ? form.values.location.id : undefined,
        name: form.values.name,
        content: resource.content,
        sendNotificationsToEveryone: true,
        subscriberIds: subscriptionsState.currentSubscribersList,
        copiedDocumentId: resource.id,
      });

      navigate(Paths.resourceHubDocumentPath(res.document.id));
    },
  });

  return (
    <Modal title={`Create a copy of ${resource.name}`} isOpen={isOpen} hideModal={hideModal}>
      <Forms.Form form={form}>
        <Forms.FieldGroup>
          <Forms.TextInput field="name" label="New document name" />
          <FolderSelectField field="location" label="Select destination" />
        </Forms.FieldGroup>

        <Forms.Submit saveText="Create Copy" cancelText="Cancel" />
      </Forms.Form>
    </Modal>
  );
}
