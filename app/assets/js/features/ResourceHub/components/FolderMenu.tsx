import React from "react";

import * as Hub from "@/models/resourceHubs";

import Forms from "@/components/Forms";
import Modal from "@/components/Modal";
import { useNodesContext } from "@/features/ResourceHub";
import { useBoolState } from "@/hooks/useBoolState";
import { createTestId } from "@/utils/testid";
import { Menu, MenuActionItem } from "turboui";
import { CopyFolderModal } from "./CopyFolder";
import { CopyResourceMenuItem } from "./CopyResource";
import { MoveResourceMenuItem, MoveResourceModal } from "./MoveResource";

interface Props {
  folder: Hub.ResourceHubFolder;
}

export function FolderMenu({ folder }: Props) {
  const { refetch } = useNodesContext();
  const { permissions } = useNodesContext();
  const [showRenameForm, toggleRenameForm] = useBoolState(false);
  const [showMoveForm, toggleMoveForm] = useBoolState(false);
  const [showCopyForm, toggleCopyForm] = useBoolState(false);
  const [showDeleteConfirmModal, toggleDeleteConfirmModal] = useBoolState(false);

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
        {permissions.canDeleteFolder && (
          <DeleteFolderMenuItem folder={folder} showConfirmModal={toggleDeleteConfirmModal} />
        )}
      </Menu>

      <RenameFolderModal
        folder={folder}
        showForm={showRenameForm}
        toggleForm={toggleRenameForm}
        // Key is needed because when the folder's name changes, if the component
        // is not rerendered, the old name will appear in the form
        key={folder.name}
        onSave={refetch}
      />
      <MoveResourceModal resource={folder} resourceType="folder" isOpen={showMoveForm} hideModal={toggleMoveForm} />
      <CopyFolderModal resource={folder} isOpen={showCopyForm} hideModal={toggleCopyForm} />
      <DeleteFolderModal folder={folder} isOpen={showDeleteConfirmModal} hideModal={toggleDeleteConfirmModal} />
    </>
  );
}

function DeleteFolderMenuItem({
  folder,
  showConfirmModal,
}: {
  folder: Hub.ResourceHubFolder;
  showConfirmModal: () => void;
}) {
  const deleteId = createTestId("delete", folder.id!);

  return (
    <MenuActionItem onClick={showConfirmModal} testId={deleteId} danger>
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

function DeleteFolderModal({
  folder,
  isOpen,
  hideModal,
}: {
  folder: Hub.ResourceHubFolder;
  isOpen: boolean;
  hideModal: () => void;
}) {
  const { refetch } = useNodesContext();
  const [remove] = Hub.useDeleteResourceHubFolder();

  const handleDelete = async () => {
    await remove({ folderId: folder.id });
    refetch();
    hideModal();
  };

  const form = Forms.useForm({
    fields: {},
    cancel: hideModal,
    submit: handleDelete,
  });

  return (
    <Modal isOpen={isOpen} hideModal={hideModal}>
      <Forms.Form form={form}>
        <p>
          Are you sure you want to delete the folder "<b>{folder.name}</b>"?
        </p>
        <Forms.Submit saveText="Delete" cancelText="Cancel" />
      </Forms.Form>
    </Modal>
  );
}

export function RenameFolderModal({ folder, showForm, toggleForm, onSave }: FormProps & { onSave: () => void }) {
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
        onSave();
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
