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
  const { parent, refetch } = useNodesContext();
  const [post] = Hub.useCreateResourceHubDocument();

  assertPresent(parent?.potentialSubscribers, "potentialSubscribers must be present in resourceHub or folder");
  assertPresent(resource.resourceHubId, "resourceHubId must be present in resource");

  const subscriptionsState = useSubscriptions(parent.potentialSubscribers, { ignoreMe: true });

  const form = Forms.useForm({
    fields: {
      location: {
        id: parent?.id,
        type: "pathToFolder" in parent ? "folder" : "resourceHub",
      },
    },
    cancel: hideModal,
    submit: async () => {
      await post({
        resourceHubId: resource.resourceHubId,
        folderId: form.values.location.type == "folder" ? form.values.location.id : undefined,
        name: resource.name,
        content: resource.content,
        sendNotificationsToEveryone: true,
        subscriberIds: subscriptionsState.currentSubscribersList,
        copiedDocumentId: resource.id,
      });

      refetch();
      hideModal();
      form.actions.reset();
    },
  });

  return (
    <Modal title={`Copy “${resource.name}”`} isOpen={isOpen} hideModal={hideModal}>
      <Forms.Form form={form}>
        <Forms.FieldGroup>
          <FolderSelectField field="location" />
        </Forms.FieldGroup>

        <Forms.Submit saveText="Copy" cancelText="Cancel" />
      </Forms.Form>
    </Modal>
  );
}
