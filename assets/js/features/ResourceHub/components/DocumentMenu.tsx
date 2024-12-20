import React from "react";

import * as Hub from "@/models/resourceHubs";

import { useBoolState } from "@/hooks/useBoolState";
import { Menu, MenuLinkItem, MenuActionItem } from "@/components/Menu";
import { Paths } from "@/routes/paths";
import { createTestId } from "@/utils/testid";
import { useNodesContext } from "@/features/ResourceHub";
import { MoveResourceMenuItem, MoveResourceModal } from "./MoveResources";

interface Props {
  document: Hub.ResourceHubDocument;
}

export function DocumentMenu({ document }: Props) {
  const { permissions } = useNodesContext();
  const [showMoveForm, toggleMoveForm] = useBoolState(false);

  const relevantPermissions = [permissions.canEditDocument, permissions.canDeleteDocument];
  const menuId = createTestId("document-menu", document.id!);

  if (!relevantPermissions.some(Boolean)) return <></>;

  return (
    <>
      <Menu size="medium" testId={menuId}>
        {permissions.canEditDocument && <EditDocumentMenuItem document={document} />}
        {permissions.canCreateDocument && <CopyDocumentMenuItem document={document} />}
        {permissions.canEditParentFolder && <MoveResourceMenuItem resource={document} showModal={toggleMoveForm} />}
        {permissions.canDeleteDocument && <DeleteDocumentMenuItem document={document} />}
      </Menu>

      <MoveResourceModal resource={document} resourceType="document" isOpen={showMoveForm} hideModal={toggleMoveForm} />
    </>
  );
}

function EditDocumentMenuItem({ document }: Props) {
  const editPath = Paths.resourceHubEditDocumentPath(document.id!);
  const editId = createTestId("edit", document.id!);

  return (
    <MenuLinkItem to={editPath} testId={editId}>
      Edit
    </MenuLinkItem>
  );
}

function CopyDocumentMenuItem({ document }: Props) {
  const parentId = document.parentFolderId || document.resourceHubId!;
  const parentType = document.parentFolderId ? "folder" : "resource_hub";
  const copyPath = Paths.resourceHubCopyDocumentPath(document.id!, parentId, parentType);

  const copyId = createTestId("copy", document.id!);

  return (
    <MenuLinkItem to={copyPath} testId={copyId}>
      Copy
    </MenuLinkItem>
  );
}

function DeleteDocumentMenuItem({ document }: Props) {
  const { refetch } = useNodesContext();
  const [remove] = Hub.useDeleteResourceHubDocument();

  const handleDelete = async () => {
    await remove({ documentId: document.id });
    refetch();
  };
  const deleteId = createTestId("delete", document.id!);

  return (
    <MenuActionItem onClick={handleDelete} testId={deleteId} danger>
      Delete
    </MenuActionItem>
  );
}
