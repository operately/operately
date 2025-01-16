import React from "react";

import * as Hub from "@/models/resourceHubs";

import { useBoolState } from "@/hooks/useBoolState";
import { Menu, MenuLinkItem, MenuActionItem } from "@/components/Menu";
import { Paths } from "@/routes/paths";
import { createTestId } from "@/utils/testid";
import { useNodesContext } from "@/features/ResourceHub";
import { MoveResourceMenuItem, MoveResourceModal } from "./MoveResource";
import { CopyResourceMenuItem } from "./CopyResource";
import { CopyDocumentModal } from "./CopyDocument";

interface Props {
  document: Hub.ResourceHubDocument;
}

export function DocumentMenu({ document }: Props) {
  const { permissions } = useNodesContext();

  const [showMoveForm, toggleMoveForm] = useBoolState(false);
  const [showCopyForm, toggleCopyForm] = useBoolState(false);

  const relevantPermissions = [
    permissions.canEditDocument,
    permissions.canCreateDocument,
    permissions.canEditParentFolder,
    permissions.canDeleteDocument,
  ];
  const menuId = createTestId("document-menu", document.id!);

  if (!relevantPermissions.some(Boolean)) return <></>;

  return (
    <>
      <Menu size="medium" testId={menuId}>
        {permissions.canEditDocument && <EditDocumentMenuItem document={document} />}
        {permissions.canCreateDocument && <CopyResourceMenuItem resource={document} showModal={toggleCopyForm} />}
        {permissions.canEditParentFolder && <MoveResourceMenuItem resource={document} showModal={toggleMoveForm} />}
        {permissions.canDeleteDocument && <DeleteDocumentMenuItem document={document} />}
      </Menu>

      <MoveResourceModal resource={document} resourceType="document" isOpen={showMoveForm} hideModal={toggleMoveForm} />
      <CopyDocumentModal resource={document} isOpen={showCopyForm} hideModal={toggleCopyForm} />
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
