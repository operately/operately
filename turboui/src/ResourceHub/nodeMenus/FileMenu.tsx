import * as React from "react";

import { DangerButton, SecondaryButton } from "../../Button";
import { Menu, MenuActionItem, MenuLinkItem } from "../../Menu";
import Modal from "../../Modal";
import { createTestId } from "../../TestableElement";
import { useResourceHubNodesListContext } from "../contexts/NodesListContext";
import type { ResourceHubFileMenuData } from "../types";
import { MoveResourceMenuItem, MoveResourceModal } from "./MoveResource";

interface FileMenuProps {
  file: ResourceHubFileMenuData;
}

export function FileMenu({ file }: FileMenuProps) {
  const { permissions } = useResourceHubNodesListContext();
  const [showMoveForm, setShowMoveForm] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);

  const toggleMoveForm = () => setShowMoveForm((value) => !value);
  const toggleDeleteModal = () => setShowDeleteModal((value) => !value);

  if (!permissions) return null;

  const menuId = createTestId("menu", file.id);

  const relevantPermissions = [permissions.canView, permissions.canEditFile, permissions.canEditParentFolder, permissions.canDeleteFile];

  if (!relevantPermissions.some(Boolean)) return null;

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

function DownloadFileMenuItem({ file }: FileMenuProps) {
  const { actions } = useResourceHubNodesListContext();

  if (!file.downloadUrl || !file.name) return null;

  const handleDownload = () => {
    const downloadFile = actions.downloadFile;

    if (!downloadFile || !file.downloadUrl || !file.name) return;

    downloadFile(file.downloadUrl, file.name);
  };

  return <MenuActionItem onClick={handleDownload}>Download</MenuActionItem>;
}

function EditFileMenuItem({ file }: FileMenuProps) {
  const { paths } = useResourceHubNodesListContext();

  if (!paths) return null;

  const editPath = paths.editFilePath(file.id);
  const editId = createTestId("edit", file.id);

  return (
    <MenuLinkItem testId={editId} to={editPath}>
      Edit
    </MenuLinkItem>
  );
}

function DeleteFileMenuItem({ file, toggleDeleteModal }: { file: ResourceHubFileMenuData; toggleDeleteModal: () => void }) {
  const deleteId = createTestId("delete", file.id);

  return (
    <MenuActionItem onClick={toggleDeleteModal} testId={deleteId} danger>
      Delete
    </MenuActionItem>
  );
}

function DeleteFileModal({ file, isOpen, hideModal }: { file: ResourceHubFileMenuData; isOpen: boolean; hideModal: () => void }) {
  const { onRefetch, actions } = useResourceHubNodesListContext();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    const deleteFile = actions.deleteFile;

    if (!deleteFile) return;

    setIsDeleting(true);
    try {
      await deleteFile(file.id);
      onRefetch?.();
      hideModal();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={hideModal}>
      <p>
        Are you sure you want to delete the file "<b>{file.name}</b>"?
      </p>
      <div className="flex items-center gap-2 mt-6">
        <DangerButton size="sm" onClick={handleDelete} loading={isDeleting} disabled={isDeleting} testId="submit">
          Delete
        </DangerButton>
        <SecondaryButton size="sm" onClick={hideModal}>
          Cancel
        </SecondaryButton>
      </div>
    </Modal>
  );
}
