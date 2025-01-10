import * as React from "react";
import * as Hub from "@/models/resourceHubs";
import * as Pages from "@/components/Pages";

import { MenuActionItem } from "@/components/Menu";
import { createTestId } from "@/utils/testid";

import Modal from "@/components/Modal";
import Forms from "@/components/Forms";

import { FolderSelectField } from "../MoveResources/FolderSelectField";
import { assertPresent } from "@/utils/assertions";
import { DecoratedNode } from "../../DecoratedNode";

export type CopyableResource = Hub.ResourceHubDocument;

interface Props {
  node: DecoratedNode;
  showModal: () => void;
}

export function CopyResourceMenuItem({ node, showModal }: Props) {
  return <MenuActionItem testId={createTestId("copy", node.resource.id!)} onClick={showModal} children="Copy" />;
}

export function CopyResourceModal({ node, isOpen, hideModal }) {
  const refresh = Pages.useRefresh();
  const [edit] = Hub.useEditParentFolderInResourceHub();

  assertPresent(node.resource.id, "resource.id must be present");

  const form = Forms.useForm({
    fields: {
      name: node.name,
      spaceId: "product",
      path: node.path,
    },
    cancel: hideModal,
    submit: async () => {
      await edit({
        // newFolderId: form.values.newFolderId,
        resourceId: node.resource.id,
        resourceType: node.type,
      });

      refresh();
      hideModal();
      form.actions.reset();
    },
  });

  return (
    <Modal title={`Create a copy of ${node.name}`} isOpen={true} hideModal={hideModal}>
      <Forms.Form form={form}>
        <Forms.FieldGroup>
          <Forms.TextInput label="New file name" field="name" />
          <FolderSelectField node={node} field="path" label="Destination folder" />
        </Forms.FieldGroup>

        <Forms.Submit saveText="Copy File" cancelText="Cancel" />
      </Forms.Form>
    </Modal>
  );
}
