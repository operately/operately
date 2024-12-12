import React, { useState } from "react";

import * as Hub from "@/models/resourceHubs";

import Modal from "@/components/Modal";
import Forms from "@/components/Forms";
import { Menu, MenuActionItem } from "@/components/Menu";
import { createTestId } from "@/utils/testid";

interface FolderMenuProps {
  permissions: Hub.ResourceHubPermissions;
  refetch: () => void;
  folder: Hub.ResourceHubFolder;
}

export function FolderMenu({ permissions, folder, refetch }: FolderMenuProps) {
  const [showRenameForm, setShowRenameForm] = useState(false);

  const relevantPermissions = [permissions.canRenameFolder, permissions.canDeleteFolder];
  const menuId = createTestId("folder-menu", folder.id!);

  if (!relevantPermissions.some(Boolean)) return <></>;

  return (
    <>
      <Menu size="medium" testId={menuId}>
        {permissions.canRenameFolder && (
          <RenameFolderMenuItem folder={folder} showForm={() => setShowRenameForm(true)} />
        )}
        {permissions.canDeleteFolder && <DeleteFolderMenuItem folder={folder} refetch={refetch} />}
      </Menu>

      <RenameFolderModal
        folder={folder}
        refresh={refetch}
        showForm={showRenameForm}
        toggleForm={() => setShowRenameForm(!showRenameForm)}
      />
    </>
  );
}

function DeleteFolderMenuItem({ folder, refetch }: { folder: Hub.ResourceHubFolder; refetch: () => void }) {
  const [remove] = Hub.useDeleteResourceHubFolder();
  const handleDelete = async () => {
    await remove({ folderId: folder.id });
    refetch();
  };
  const deleteId = createTestId("delete", folder.id!);

  return (
    <MenuActionItem onClick={handleDelete} testId={deleteId} danger>
      Delete folder
    </MenuActionItem>
  );
}

function RenameFolderMenuItem({ folder, showForm }: { folder: Hub.ResourceHubFolder; showForm: () => void }) {
  const testId = createTestId("rename-folder", folder.id!);

  return (
    <MenuActionItem onClick={showForm} testId={testId}>
      Rename folder
    </MenuActionItem>
  );
}

interface FormProps {
  folder: Hub.ResourceHubFolder;
  showForm: boolean;
  toggleForm: () => void;
  refresh: () => void;
}

function RenameFolderModal({ folder, showForm, toggleForm, refresh }: FormProps) {
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
      refresh();
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
