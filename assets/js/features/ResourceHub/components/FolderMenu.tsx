import React from "react";

import * as Hub from "@/models/resourceHubs";
import * as Pages from "@/components/Pages";

import Modal from "@/components/Modal";
import Forms from "@/components/Forms";
import { useBoolState } from "@/hooks/useBoolState";
import { Menu, MenuActionItem } from "@/components/Menu";
import { createTestId } from "@/utils/testid";
import { MoveResourceMenuItem, MoveResourceModal } from "./MoveResources";
import { DecoratedNode } from "../DecoratedNode";

interface Props {
  node: DecoratedNode;
}

export function FolderMenu({ node }: Props) {
  const folder = node.resource as Hub.ResourceHubFolder;
  const [showRenameForm, toggleRenameForm] = useBoolState(false);
  const [showMoveForm, toggleMoveForm] = useBoolState(false);

  const relevantPermissions = [node.permissions.canRenameFolder, node.permissions.canDeleteFolder];
  const menuId = createTestId("folder-menu", folder.id!);

  if (!relevantPermissions.some(Boolean)) return <></>;

  return (
    <>
      <Menu size="medium" testId={menuId}>
        {node.permissions.canRenameFolder && <RenameFolderMenuItem folder={folder} showForm={toggleRenameForm} />}
        {node.permissions.canEditParentFolder && <MoveResourceMenuItem resource={folder} showModal={toggleMoveForm} />}
        {node.permissions.canDeleteFolder && <DeleteFolderMenuItem folder={folder} />}
      </Menu>

      <RenameFolderModal folder={folder} showForm={showRenameForm} toggleForm={toggleRenameForm} />
      <MoveResourceModal node={node} isOpen={showMoveForm} hideModal={toggleMoveForm} />
    </>
  );
}

function DeleteFolderMenuItem({ node }: Props) {
  const refresh = Pages.useRefresh();
  const [remove] = Hub.useDeleteResourceHubFolder();

  const handleDelete = async () => {
    await remove({ folderId: node.resource.id });
    refresh();
  };
  const deleteId = createTestId("delete", node.resource.id!);

  return (
    <MenuActionItem onClick={handleDelete} testId={deleteId} danger>
      Delete
    </MenuActionItem>
  );
}

function RenameFolderMenuItem({ folder, showForm }: { folder: Hub.ResourceHubFolder; showForm: () => void }) {
  const testId = createTestId("rename-folder", folder.id!);

  return (
    <MenuActionItem onClick={showForm} testId={testId}>
      Rename
    </MenuActionItem>
  );
}

interface FormProps {
  folder: Hub.ResourceHubFolder;
  showForm: boolean;
  toggleForm: () => void;
}

function RenameFolderModal({ folder, showForm, toggleForm }: FormProps) {
  const refetch = Pages.useRefresh();
  const [rename] = Hub.useRenameResourceHubFolder();

  const form = Forms.useForm({
    fields: {
      name: folder.name,
    },
    validate: (addError) => {
      if (!form.values.name) {
        addError("name", "Name is required");
      }
    },
    cancel: toggleForm,
    submit: async () => {
      await rename({
        folderId: folder.id,
        newName: form.values.name,
      });
      refetch();
      toggleForm();
      form.actions.reset();
    },
  });

  return (
    <Modal title="Rename folder" isOpen={showForm} hideModal={toggleForm}>
      <Forms.Form form={form}>
        <Forms.FieldGroup>
          <Forms.TextInput label="Name" field="name" testId="new-folder-name" />
        </Forms.FieldGroup>

        <Forms.Submit cancelText="Cancel" />
      </Forms.Form>
    </Modal>
  );
}
