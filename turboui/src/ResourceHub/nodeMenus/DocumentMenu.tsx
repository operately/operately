import * as React from "react";

import { DangerButton, SecondaryButton } from "../../Button";
import { Menu, MenuActionItem, MenuLinkItem } from "../../Menu";
import Modal from "../../Modal";
import { createTestId } from "../../TestableElement";
import { useResourceHubNodesListContext } from "../contexts/NodesListContext";
import { getResourceName } from "../selectors";
import type { ResourceHubDocument } from "../types";
import { CopyDocumentModal } from "./CopyDocumentModal";
import { CopyResourceMenuItem } from "./CopyResource";
import { MoveResourceMenuItem, MoveResourceModal } from "./MoveResource";

interface DocumentMenuProps {
  document: ResourceHubDocument;
}

export function DocumentMenu({ document }: DocumentMenuProps) {
  const { permissions } = useResourceHubNodesListContext();
  const [showMoveForm, setShowMoveForm] = React.useState(false);
  const [showCopyForm, setShowCopyForm] = React.useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = React.useState(false);

  const toggleMoveForm = () => setShowMoveForm((value) => !value);
  const toggleCopyForm = () => setShowCopyForm((value) => !value);
  const toggleDeleteConfirmModal = () => setShowDeleteConfirmModal((value) => !value);

  if (!permissions) return null;

  const relevantPermissions = [
    permissions.canEditDocument,
    permissions.canCreateDocument,
    permissions.canEditParentFolder,
    permissions.canDeleteDocument,
  ];
  const menuId = createTestId("menu", document.id);

  if (!relevantPermissions.some(Boolean)) return null;

  return (
    <>
      <Menu size="medium" testId={menuId}>
        {permissions.canEditDocument && <EditDocumentMenuItem document={document} />}
        {permissions.canCreateDocument && <CopyResourceMenuItem resource={document} showModal={toggleCopyForm} />}
        {permissions.canEditParentFolder && <MoveResourceMenuItem resource={document} showModal={toggleMoveForm} />}
        {permissions.canView && <ExportMarkdownMenuItem document={document} />}
        {permissions.canDeleteDocument && (
          <DeleteDocumentMenuItem document={document} showConfirmModal={toggleDeleteConfirmModal} />
        )}
      </Menu>

      <MoveResourceModal resource={document} resourceType="document" isOpen={showMoveForm} hideModal={toggleMoveForm} />
      <CopyDocumentModal resource={document} isOpen={showCopyForm} hideModal={toggleCopyForm} />
      <DeleteDocumentModal document={document} isOpen={showDeleteConfirmModal} hideModal={toggleDeleteConfirmModal} />
    </>
  );
}

function EditDocumentMenuItem({ document }: DocumentMenuProps) {
  const { paths } = useResourceHubNodesListContext();

  if (!paths) return null;

  const editPath = paths.editDocumentPath(document.id);
  const editId = createTestId("edit", document.id);

  return (
    <MenuLinkItem to={editPath} testId={editId}>
      Edit
    </MenuLinkItem>
  );
}

function DeleteDocumentMenuItem({
  document,
  showConfirmModal,
}: {
  document: ResourceHubDocument;
  showConfirmModal: () => void;
}) {
  const deleteId = createTestId("delete", document.id);

  return (
    <MenuActionItem onClick={showConfirmModal} testId={deleteId} danger>
      Delete
    </MenuActionItem>
  );
}

function DeleteDocumentModal({
  document,
  isOpen,
  hideModal,
}: {
  document: ResourceHubDocument;
  isOpen: boolean;
  hideModal: () => void;
}) {
  const { onRefetch, actions } = useResourceHubNodesListContext();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    const deleteDocument = actions.deleteDocument;

    if (!deleteDocument) return;

    setIsDeleting(true);
    try {
      await deleteDocument(document.id);
      onRefetch?.();
      hideModal();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={hideModal}>
      <p>
        Are you sure you want to delete the document "<b>{getResourceName(document)}</b>"?
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

function ExportMarkdownMenuItem({ document }: DocumentMenuProps) {
  const { actions } = useResourceHubNodesListContext();

  const handleExport = () => {
    if (!document.content) return;

    const exportDocumentMarkdown = actions.exportDocumentMarkdown;

    if (!exportDocumentMarkdown) return;

    exportDocumentMarkdown(document.content, getResourceName(document) || "document");
  };

  return (
    <MenuActionItem onClick={handleExport} testId={createTestId("export-markdown", document.id)}>
      Export as Markdown
    </MenuActionItem>
  );
}
