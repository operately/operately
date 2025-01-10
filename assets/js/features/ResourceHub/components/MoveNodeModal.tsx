import React from "react";

import Modal from "@/components/Modal";
import Forms from "@/components/Forms";

import { FolderSelectField } from "./MoveResources/FolderSelectField";
import { Node } from "@/features/ResourceHub/models";

interface FormProps {
  node: Node;
  isOpen: boolean;
  hideModal: () => void;
}

export function MoveNodeModal({ node, isOpen, hideModal }: FormProps) {
  // const { parent, refetch } = useNodesContext();
  // const [edit] = Hub.useEditParentFolderInResourceHub();

  // const locationChanged = () => {
  //   if (!resource.parentFolderId && !form.values.newFolderId) return false;
  //   if (resource.parentFolderId === form.values.newFolderId) return false;
  //   return true;
  // };

  const form = Forms.useForm({
    fields: {
      // newFolderId: "pathToFolder" in parent ? parent.id : null,
    },
    // validate: (addError) => {
    //   // if (resource.id === form.values.newFolderId) {
    //   //   addError("newFolderId", "Folder cannot be moved inside itself.");
    //   // }
    // },
    cancel: hideModal,
    submit: async () => {
      // if (locationChanged()) {
      //   await edit({
      //     newFolderId: form.values.newFolderId,
      //     resourceId: resource.id,
      //     resourceType: resourceType,
      //   });
      //   refetch();
      // }
      // hideModal();
      // form.actions.reset();
    },
  });

  return (
    <Modal title={`Move “${node.name}”`} isOpen={isOpen} hideModal={hideModal}>
      <Forms.Form form={form}>
        <Forms.FieldGroup>
          <FolderSelectField node={node} />
        </Forms.FieldGroup>

        <Forms.Submit saveText="Move" cancelText="Cancel" />
      </Forms.Form>
    </Modal>
  );
}
