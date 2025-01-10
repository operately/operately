import React from "react";

import * as Hub from "@/models/resourceHubs";

import Modal from "@/components/Modal";
import Forms from "@/components/Forms";
import { MenuActionItem } from "@/components/Menu";
import { createTestId } from "@/utils/testid";
import { useNodesContext } from "@/features/ResourceHub";

import { FolderSelectField } from "./FolderSelectField";
import { MovableResource } from ".";
import { DecoratedNode } from "../../DecoratedNode";

interface Props {
  node: DecoratedNode;
  showModal: () => void;
}

export function MoveResourceMenuItem({ node, showModal }: Props) {
  const testId = createTestId("move-resource", node.resource.id!);

  return (
    <MenuActionItem onClick={showModal} testId={testId}>
      Move
    </MenuActionItem>
  );
}

interface FormProps {
  node: DecoratedNode;
  isOpen: boolean;
  hideModal: () => void;
}

export function MoveResourceModal({ node, resourceType, isOpen, hideModal }: FormProps) {
  // const { parent, refetch } = useNodesContext();
  // const [edit] = Hub.useEditParentFolderInResourceHub();
  // const locationChanged = () => {
  //   if (!resource.parentFolderId && !form.values.newFolderId) return false;
  //   if (resource.parentFolderId === form.values.newFolderId) return false;
  //   return true;
  // };
  // const form = Forms.useForm({
  //   fields: {
  //     newFolderId: "pathToFolder" in parent ? parent.id : null,
  //   },
  //   validate: (addError) => {
  //     if (resource.id === form.values.newFolderId) {
  //       addError("newFolderId", "Folder cannot be moved inside itself.");
  //     }
  //   },
  //   cancel: hideModal,
  //   submit: async () => {
  //     if (locationChanged()) {
  //       await edit({
  //         newFolderId: form.values.newFolderId,
  //         resourceId: resource.id,
  //         resourceType: resourceType,
  //       });
  //       refetch();
  //     }
  //     hideModal();
  //     form.actions.reset();
  //   },
  // });
  // return (
  //   <Modal title={`Move “${resource.name}”`} isOpen={isOpen} hideModal={hideModal}>
  //     <Forms.Form form={form}>
  //       <Forms.FieldGroup>
  //         <FolderSelectField resource={resource} field="newFolderId" startLocation={parent} />
  //       </Forms.FieldGroup>
  //       <Forms.Submit saveText="Move" cancelText="Cancel" />
  //     </Forms.Form>
  //   </Modal>
  // );
  return <></>;
}
