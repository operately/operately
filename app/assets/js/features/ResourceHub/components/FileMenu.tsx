import React from "react";

import * as Hub from "@/models/resourceHubs";
import Modal from "@/components/Modal";
import Forms from "@/components/Forms";

import { MoveResourceMenuItem, MoveResourceModal } from "./MoveResource";

import { useNodesContext } from "@/features/ResourceHub";
import { useBoolState } from "@/hooks/useBoolState";
import { useDownloadFile } from "@/models/blobs";
import { assertPresent } from "@/utils/assertions";
import { createTestId } from "@/utils/testid";
import { Menu, MenuActionItem, MenuLinkItem } from "turboui";

import { usePaths } from "@/routes/paths";
interface Props {
  file: Hub.ResourceHubFile;
}

export function FileMenu({ file }: Props) {
  const { permissions } = useNodesContext();
  const [showMoveForm, toggleMoveForm] = useBoolState(false);
  const [showDeleteModal, toggleDeleteModal] = useBoolState(false);
  const menuId = createTestId("menu", file.id!);

  const relevantPermissions = [permissions.canView, permissions.canEditParentFolder, permissions.canDeleteFile];

  if (!relevantPermissions.some(Boolean)) return <></>;

  return (
    <>
      <Menu size="medium" testId={menuId}>
        {permissions.canView && <DownloadFileMenuItem file={file} />}
        {permissions.canEditFile && <EditFileMenuItem file={file} />}
        {permissions.canEditParentFolder && <MoveResourceMenuItem resource={file} showModal={toggleMoveForm} />}
        {permissions.canDeleteFile && <DeleteFileMenuItem file={file} toggleDeleteModal={toggleDeleteModal} />}
      </Menu>

      <MoveResourceModal resource={file} resourceType="file" isOpen={showMoveForm} hideModal={toggleMoveForm} />
      <DeleteFileModal file={file} isOpen={showDeleteModal} hideModal={toggleDeleteModal} />
    </>
  );
}

function DownloadFileMenuItem({ file }: Props) {
  assertPresent(file.blob?.url, "blob.url must be present in file");
  assertPresent(file.name, "name must be present in file");

  const [downloadFile] = useDownloadFile(file.blob.url, file.name);

  return <MenuActionItem onClick={downloadFile}>Download</MenuActionItem>;
}

function EditFileMenuItem({ file }: Props) {
  const paths = usePaths();
  const editPath = paths.resourceHubEditFilePath(file.id!);
  const editId = createTestId("edit", file.id!);

  return (
    <MenuLinkItem testId={editId} to={editPath}>
      Edit
    </MenuLinkItem>
  );
}

interface DeleteFileMenuItemProps {
  file: Hub.ResourceHubFile;
  toggleDeleteModal: () => void;
}

function DeleteFileMenuItem({ file, toggleDeleteModal }: DeleteFileMenuItemProps) {
  const deleteId = createTestId("delete", file.id!);

  return (
    <MenuActionItem onClick={toggleDeleteModal} testId={deleteId} danger>
      Delete
    </MenuActionItem>
  );
}

interface DeleteFileModalProps {
  file: Hub.ResourceHubFile;
  isOpen: boolean;
  hideModal: () => void;
}

function DeleteFileModal({ file, isOpen, hideModal }: DeleteFileModalProps) {
  const { refetch } = useNodesContext();
  const [remove] = Hub.useDeleteResourceHubFile();

  const handleDelete = async () => {
    await remove({ fileId: file.id });
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
          Are you sure you want to delete the file "<b>{file.name}</b>"?
        </p>
        <Forms.Submit saveText="Delete" cancelText="Cancel" />
      </Forms.Form>
    </Modal>
  );
}
