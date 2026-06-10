import * as React from "react";

import { DangerButton, SecondaryButton } from "../../Button";
import { Menu, MenuActionItem } from "../../Menu";
import Modal from "../../Modal";
import { createTestId } from "../../TestableElement";
import { useResourceHubNodesListContext } from "../contexts/NodesListContext";
import type { ResourceHubFolderMenuData, ResourceHubFormsApi, ResourceHubModalApi } from "../types";
import { CopyFolderModal } from "./CopyFolder";
import { CopyResourceMenuItem } from "./CopyResource";
import { MoveResourceMenuItem, MoveResourceModal } from "./MoveResource";

interface FolderMenuProps {
  folder: ResourceHubFolderMenuData;
}

export function FolderMenu({ folder }: FolderMenuProps) {
  const { permissions, onRefetch, forms, modal, actions } = useResourceHubNodesListContext();
  const [showRenameForm, setShowRenameForm] = React.useState(false);
  const [showMoveForm, setShowMoveForm] = React.useState(false);
  const [showCopyForm, setShowCopyForm] = React.useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = React.useState(false);

  const toggleRenameForm = () => setShowRenameForm((value) => !value);
  const toggleMoveForm = () => setShowMoveForm((value) => !value);
  const toggleCopyForm = () => setShowCopyForm((value) => !value);
  const toggleDeleteConfirmModal = () => setShowDeleteConfirmModal((value) => !value);

  if (!permissions) return null;

  const renameFolder = actions.renameFolder;

  const relevantPermissions = [
    permissions.canRenameFolder,
    permissions.canCopyFolder,
    permissions.canEditParentFolder,
    permissions.canDeleteFolder,
  ];
  const menuId = createTestId("menu", folder.id);

  if (!relevantPermissions.some(Boolean)) return null;

  return (
    <>
      <Menu size="medium" testId={menuId}>
        {permissions.canRenameFolder && renameFolder && (
          <RenameFolderMenuItem folder={folder} showForm={toggleRenameForm} />
        )}
        {permissions.canCopyFolder && <CopyResourceMenuItem resource={folder} showModal={toggleCopyForm} />}
        {permissions.canEditParentFolder && <MoveResourceMenuItem resource={folder} showModal={toggleMoveForm} />}
        {permissions.canDeleteFolder && (
          <DeleteFolderMenuItem folder={folder} showConfirmModal={toggleDeleteConfirmModal} />
        )}
      </Menu>

      {renameFolder && (
        <RenameFolderModal
          folder={folder}
          showForm={showRenameForm}
          toggleForm={toggleRenameForm}
          key={folder.name}
          onSave={() => onRefetch?.()}
          forms={forms}
          modal={modal}
          onRename={renameFolder}
        />
      )}
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
  folder: ResourceHubFolderMenuData;
  showConfirmModal: () => void;
}) {
  const deleteId = createTestId("delete", folder.id);

  return (
    <MenuActionItem onClick={showConfirmModal} testId={deleteId} danger>
      Delete
    </MenuActionItem>
  );
}

function RenameFolderMenuItem({ folder, showForm }: { folder: ResourceHubFolderMenuData; showForm: () => void }) {
  const testId = createTestId("rename-folder", folder.id);

  return (
    <MenuActionItem onClick={showForm} testId={testId}>
      Rename
    </MenuActionItem>
  );
}

function DeleteFolderModal({
  folder,
  isOpen,
  hideModal,
}: {
  folder: ResourceHubFolderMenuData;
  isOpen: boolean;
  hideModal: () => void;
}) {
  const { onRefetch, actions } = useResourceHubNodesListContext();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    const deleteFolder = actions.deleteFolder;

    if (!deleteFolder) return;

    setIsDeleting(true);
    try {
      await deleteFolder(folder.id);
      onRefetch?.();
      hideModal();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={hideModal}>
      <p>
        Are you sure you want to delete the folder "<b>{folder.name}</b>"?
      </p>
      <div className="flex items-center gap-2 mt-6">
        <DangerButton size="sm" onClick={handleDelete} loading={isDeleting} disabled={isDeleting}>
          Delete
        </DangerButton>
        <SecondaryButton size="sm" onClick={hideModal}>
          Cancel
        </SecondaryButton>
      </div>
    </Modal>
  );
}

export interface RenameFolderModalProps {
  folder: { id: string; name?: string | null };
  showForm: boolean;
  toggleForm: () => void;
  onSave: () => void;
  forms: ResourceHubFormsApi;
  modal: ResourceHubModalApi;
  onRename: (id: string, name: string) => Promise<void>;
}

export function RenameFolderModal({ folder, showForm, toggleForm, onSave, forms, modal, onRename }: RenameFolderModalProps) {
  const { Modal } = modal;

  const form = forms.useForm({
    fields: {
      name: folder.name,
    },
    validate: (addError: (field: string, message: string) => void) => {
      if (!form.values.name) {
        addError("name", "Name is required");
      }
    },
    cancel: toggleForm,
    submit: async () => {
      const name = form.values.name as string;

      if (name !== folder.name) {
        await onRename(folder.id, name);
        onSave();
      }
      toggleForm();
      form.actions.reset();
    },
  });

  return (
    <Modal title="Rename folder" isOpen={showForm} hideModal={toggleForm}>
      <forms.Form form={form}>
        <forms.FieldGroup>
          <forms.TextInput label="Name" field="name" testId="new-folder-name" autoFocus />
        </forms.FieldGroup>

        <forms.Submit cancelText="Cancel" />
      </forms.Form>
    </Modal>
  );
}
