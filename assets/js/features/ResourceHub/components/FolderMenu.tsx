import React from "react";

import * as Hub from "@/models/resourceHubs";

import Modal from "@/components/Modal";
import Forms from "@/components/Forms";
import { useBoolState } from "@/hooks/useBoolState";
import { Menu, MenuActionItem } from "@/components/Menu";
import { createTestId } from "@/utils/testid";
import { useNodesContext } from "@/features/ResourceHub";
import { MoveResourceMenuItem, MoveResourceModal } from "./MoveResource";
import { CopyResourceMenuItem } from "./CopyResource";
import { CopyFolderModal } from "./CopyFolder";

interface Props {
  folder: Hub.ResourceHubFolder;
}

export function FolderMenu({ folder }: Props) {
  const { permissions } = useNodesContext();
  const [showRenameForm, toggleRenameForm] = useBoolState(false);
  const [showMoveForm, toggleMoveForm] = useBoolState(false);
  const [showCopyForm, toggleCopyForm] = useBoolState(false);

  const relevantPermissions = [
    permissions.canRenameFolder,
    permissions.canCopyFolder,
    permissions.canEditParentFolder,
    permissions.canDeleteFolder,
  ];
  const menuId = createTestId("menu", folder.id!);

  if (!relevantPermissions.some(Boolean)) return <></>;

  return (
    <>
      <Menu size="medium" testId={menuId}>
        {permissions.canRenameFolder && <RenameFolderMenuItem folder={folder} showForm={toggleRenameForm} />}
        {permissions.canCopyFolder && <CopyResourceMenuItem resource={folder} showModal={toggleCopyForm} />}
        {permissions.canEditParentFolder && <MoveResourceMenuItem resource={folder} showModal={toggleMoveForm} />}
        {permissions.canDeleteFolder && <DeleteFolderMenuItem folder={folder} />}
      </Menu>

      <RenameFolderModal
        folder={folder}
        showForm={showRenameForm}
        toggleForm={toggleRenameForm}
        // Key is needed because when the folder's name changes, if the component
        // is not rerendered, the old name will appear in the form
        key={folder.name}
      />
      <MoveResourceModal resource={folder} resourceType="folder" isOpen={showMoveForm} hideModal={toggleMoveForm} />
      <CopyFolderModal resource={folder} isOpen={showCopyForm} hideModal={toggleCopyForm} />
    </>
  );
}

function DeleteFolderMenuItem({ folder }: Props) {
  const { refetch } = useNodesContext();
  const [remove] = Hub.useDeleteResourceHubFolder();

  const handleDelete = async () => {
    await remove({ folderId: folder.id });
    refetch();
  };
  const deleteId = createTestId("delete", folder.id!);

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
  const { refetch } = useNodesContext();
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
      const { name } = form.values;

      if (name !== folder.name) {
        await rename({
          folderId: folder.id,
          newName: name,
        });
        refetch();
      }
      toggleForm();
      form.actions.reset();
    },
  });

  return (
    <Modal title="Rename folder" isOpen={showForm} hideModal={toggleForm}>
      <Forms.Form form={form}>
        <Forms.FieldGroup>
          <Forms.TextInput label="Name" field="name" testId="new-folder-name" autoFocus />
        </Forms.FieldGroup>

        <Forms.Submit cancelText="Cancel" />
      </Forms.Form>
    </Modal>
  );
}
